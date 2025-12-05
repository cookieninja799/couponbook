// server/src/routes/couponSubmissions.js
import express from 'express';
import { db } from '../db.js';
import { couponSubmission, coupon, merchant, user } from '../schema.js';
import { eq, and, inArray } from 'drizzle-orm';
import auth from '../middleware/auth.js';

const router = express.Router();
console.log('📦  couponSubmissions router loaded');

// ────────────────────────────────────────────────────────────────
// GET all submissions, or only for one group (pending only)
// ────────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  console.log('📦  GET /api/v1/coupon-submissions hit', req.query);
  try {
    const { groupId } = req.query;

    // base: only pending
    let whereExpr = eq(couponSubmission.state, 'pending');

    // optional filter by group
    if (groupId) {
      whereExpr = and(whereExpr, eq(couponSubmission.groupId, groupId));
    }

    const subs = await db
      .select({
        id:             couponSubmission.id,
        groupId:        couponSubmission.groupId,
        merchantId:     couponSubmission.merchantId,
        merchantName:   merchant.name,
        state:          couponSubmission.state,
        submittedAt:    couponSubmission.submittedAt,
        submissionData: couponSubmission.submissionData,
        deletedAt:      couponSubmission.deletedAt,
      })
      .from(couponSubmission)
      .leftJoin(merchant, eq(merchant.id, couponSubmission.merchantId))
      .where(whereExpr);

    console.log(`📦  returning ${subs.length} submissions`);
    res.json(subs);
  } catch (err) {
    console.error('📦  error in GET /coupon-submissions', err);
    next(err);
  }
});

// ────────────────────────────────────────────────────────────────
// NEW: GET /api/v1/coupon-submissions/by-merchant
// Returns all submissions for merchants owned by the authed user,
// optionally filtered by ?state=rejected / ?state=pending / etc.
// ────────────────────────────────────────────────────────────────
router.get('/by-merchant', auth(), async (req, res, next) => {
  console.log('📦  GET /api/v1/coupon-submissions/by-merchant');
  try {
    const authedSub = req.user && req.user.sub;
    if (!authedSub) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1) Find local user row by Cognito sub
    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.cognitoSub, authedSub));

    if (!dbUser) {
      console.warn('📦  No local user for sub in by-merchant', authedSub);
      return res.status(403).json({ error: 'User not registered' });
    }

    // 2) Find all merchants owned by this user
    const ownedMerchants = await db
      .select({
        id:   merchant.id,
        name: merchant.name,
      })
      .from(merchant)
      .where(eq(merchant.ownerId, dbUser.id));

    if (ownedMerchants.length === 0) {
      return res.json([]);
    }

    const merchantIds = ownedMerchants.map((m) => m.id);

    // Optional state filter (?state=rejected, ?state=pending, etc.)
    const { state } = req.query;

    const baseWhere = [
      inArray(couponSubmission.merchantId, merchantIds),
      eq(couponSubmission.deletedAt, null), // ignore soft-deleted
    ];

    const whereExpr = state
      ? and(...baseWhere, eq(couponSubmission.state, state))
      : and(...baseWhere);

    // 3) Load submissions + join merchant name
    const rows = await db
      .select({
        id:              couponSubmission.id,
        merchant_id:     couponSubmission.merchantId,
        group_id:        couponSubmission.groupId,
        state:           couponSubmission.state,
        submitted_at:    couponSubmission.submittedAt,
        submission_data: couponSubmission.submissionData,
        deleted_at:      couponSubmission.deletedAt,
        merchant_name:   merchant.name,
      })
      .from(couponSubmission)
      .leftJoin(
        merchant,
        eq(couponSubmission.merchantId, merchant.id),
      )
      .where(whereExpr)
      .orderBy(couponSubmission.submittedAt);

    return res.json(rows);
  } catch (err) {
    console.error('📦  error in GET /coupon-submissions/by-merchant', err);
    next(err);
  }
});

// ────────────────────────────────────────────────────────────────
// GET a single submission by ID
// ────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  console.log('📦  GET /api/v1/coupon-submissions/' + req.params.id);
  try {
    const [sub] = await db
      .select()
      .from(couponSubmission)
      .where(eq(couponSubmission.id, req.params.id));
    if (!sub) {
      console.log('📦  submission not found');
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.json(sub);
  } catch (err) {
    console.error('📦  error in GET /coupon-submissions/:id', err);
    next(err);
  }
});

// ────────────────────────────────────────────────────────────────
// POST new submission
// ────────────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  console.log('📦  POST /api/v1/coupon-submissions', req.body);
  try {
    const { group_id, merchant_id, submission_data } = req.body;
    const [newSub] = await db
      .insert(couponSubmission)
      .values({
        groupId:        group_id,
        merchantId:     merchant_id,
        state:          'pending',
        submissionData: submission_data,
      })
      .returning();
    res.status(201).json(newSub);
  } catch (err) {
    console.error('📦  error in POST /coupon-submissions', err);
    return res
      .status(500)
      .json({ error: err.message, detail: err.cause?.message });
  }
});

// ────────────────────────────────────────────────────────────────
// PUT update submission (approve/reject → may create coupon)
// ────────────────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  const submissionId = req.params.id;
  const { state, message } = req.body;
  console.log(`📦  PUT /api/v1/coupon-submissions/${submissionId}`, { state, message });

  try {
    const updateData = { state };
    if (state === 'rejected' && message) {
      updateData.rejectionMessage = message;
    }

    const [updated] = await db
      .update(couponSubmission)
      .set(updateData)
      .where(eq(couponSubmission.id, submissionId))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    console.log(`📦  submission ${submissionId} updated to "${state}"`);

    if (state === 'approved') {
      const { submissionData, groupId, merchantId } = updated;
      const couponPayload = {
        groupId,
        merchantId,
        title:         submissionData.title,
        description:   submissionData.description,
        couponType:    submissionData.coupon_type,
        discountValue: submissionData.discount_value,
        validFrom:     new Date(submissionData.valid_from),
        expiresAt:     new Date(submissionData.expires_at),
        qrCodeUrl:     submissionData.qr_code_url,
        locked:        submissionData.locked,
      };

      const [newCoupon] = await db
        .insert(coupon)
        .values(couponPayload)
        .returning();

      console.log(`📦  created coupon ${newCoupon.id} from submission ${submissionId}`);
      // fire-and-forget webhook...
      return res.json(newCoupon);
    }

    if (state === 'rejected') {
      // fire-and-forget rejection webhook...
      return res.json(updated);
    }

    return res.json(updated);
  } catch (err) {
    console.error(`❌ Error in PUT /coupon-submissions/${submissionId}:`, err);
    next(err);
  }
});

export default router;
