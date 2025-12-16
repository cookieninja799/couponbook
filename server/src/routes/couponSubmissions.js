// server/src/routes/couponSubmissions.js
import express from 'express';
import { db } from '../db.js';
import {
  couponSubmission,
  coupon,
  merchant,
  user,
  foodieGroupMembership,   // ⬅️ add this
} from '../schema.js';
import { eq, and, inArray, isNull } from 'drizzle-orm';
import auth from '../middleware/auth.js';

const router = express.Router();
console.log('📦  couponSubmissions router loaded');

// ────────────────────────────────────────────────────────────────
// GET all pending submissions for a specific group (dashboard)
// If groupId is not provided, infer it from foodie_group_membership
// for the current foodie_group_admin / admin.
// ────────────────────────────────────────────────────────────────
router.get('/', auth(), async (req, res, next) => {
  console.log('📦  GET /api/v1/coupon-submissions hit', req.query);
  try {
    let { groupId } = req.query;

    // If no groupId passed, infer from membership
    if (!groupId) {
      const authedSub = req.user && req.user.sub;
      if (!authedSub) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Look up local user
      const [dbUser] = await db
        .select()
        .from(user)
        .where(eq(user.cognitoSub, authedSub));

      if (!dbUser) {
        console.warn('📦  No local user for sub in GET /coupon-submissions', authedSub);
        return res.status(403).json({ error: 'User not registered' });
      }

      // Super admin shortcut: later you may support multi-group admin;
      // for now, this is the “default group” behavior.
      if (dbUser.role === 'admin') {
        // For now, admins must still pass groupId explicitly if they manage many groups.
        return res.status(400).json({ error: 'groupId is required for admin users' });
      }

      // Find memberships for this user
      const memberships = await db
        .select()
        .from(foodieGroupMembership)
        .where(eq(foodieGroupMembership.userId, dbUser.id));

      if (!memberships.length) {
        return res.status(403).json({
          error: 'No foodie group membership found for this user',
        });
      }

      // For now, assume single-group admin; pick the first group
      const membership = memberships[0];
      groupId = membership.groupId;
      console.log('📦  inferred groupId from membership', groupId);
    }

    // 🔐 Ensure this user can admin this group
    const dbUser = await requireGroupAdmin(req, res, groupId);
    if (!dbUser) return; // response already sent

    // Only pending for that group
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
      .where(
        and(
          eq(couponSubmission.state, 'pending'),
          eq(couponSubmission.groupId, groupId),
        ),
      );

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
      isNull(couponSubmission.deletedAt), // ignore soft-deleted
    ];

    const whereExpr = state
      ? and(...baseWhere, eq(couponSubmission.state, state))
      : and(...baseWhere);

    // 3) Load submissions + join merchant name
    const rows = await db
      .select({
        id:              couponSubmission.id,
        merchantId:       couponSubmission.merchantId,
        groupId:          couponSubmission.groupId,
        state:            couponSubmission.state,
        submittedAt:      couponSubmission.submittedAt,
        submissionData:   couponSubmission.submissionData,
        rejectionMessage: couponSubmission.rejectionMessage,
        deletedAt:        couponSubmission.deletedAt,
        merchantName:     merchant.name,
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
router.get('/:id', auth(), async (req, res, next) => {
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

    // 🔐 authorize: admin OR merchant-owner OR group-admin
    const authedSub = req.user && req.user.sub;
    if (!authedSub) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.cognitoSub, authedSub));

    if (!dbUser) {
      return res.status(403).json({ error: 'User not registered' });
    }

    // Admin sees all
    if (dbUser.role === 'admin') {
      return res.json(sub);
    }

    // Merchant owner can read their own submission
    if (sub.merchantId) {
      const [dbMerchant] = await db
        .select()
        .from(merchant)
        .where(eq(merchant.id, sub.merchantId));

      if (dbMerchant && dbMerchant.ownerId === dbUser.id) {
        return res.json(sub);
      }
    }

    // Foodie group admin can read submissions for their group
    const ok = await requireGroupAdmin(req, res, sub.groupId);
    if (!ok) return; // response already sent

    res.json(sub);
  } catch (err) {
    console.error('📦  error in GET /coupon-submissions/:id', err);
    next(err);
  }
});

// ────────────────────────────────────────────────────────────────
// POST new submission
// ────────────────────────────────────────────────────────────────
router.post('/', auth(), async (req, res, next) => {
  console.log('📦  POST /api/v1/coupon-submissions', req.body);
  try {
    const { group_id, merchant_id, submission_data } = req.body;

    const authedSub = req.user && req.user.sub;
    if (!authedSub) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.cognitoSub, authedSub));

    if (!dbUser) {
      return res.status(403).json({ error: 'User not registered' });
    }

    if (!group_id) {
      return res.status(400).json({ error: 'group_id is required' });
    }
    if (!merchant_id) {
      return res.status(400).json({ error: 'merchant_id is required' });
    }
    if (!submission_data) {
      return res.status(400).json({ error: 'submission_data is required' });
    }

    // Verify merchant exists and enforce ownership (admin bypass)
    const [dbMerchant] = await db
      .select()
      .from(merchant)
      .where(eq(merchant.id, merchant_id));

    if (!dbMerchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    if (dbUser.role !== 'admin' && dbMerchant.ownerId !== dbUser.id) {
      return res.status(403).json({ error: 'You do not own this merchant' });
    }

    const [newSub] = await db
      .insert(couponSubmission)
      .values({
        groupId:        group_id,
        // Hardening: always write the merchant ID we just validated
        merchantId:     dbMerchant.id,
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
// Only foodie_group_admin for that group (or admin) can do this.
// ────────────────────────────────────────────────────────────────
router.put('/:id', auth(), async (req, res, next) => {
  const submissionId = req.params.id;
  const { state, message } = req.body;
  console.log(`📦  PUT /api/v1/coupon-submissions/${submissionId}`, {
    state,
    message,
  });

  try {
    // Load submission first so we know its groupId
    const [existing] = await db
      .select()
      .from(couponSubmission)
      .where(eq(couponSubmission.id, submissionId));

    if (!existing) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const groupId = existing.groupId;
    if (!groupId) {
      console.warn('📦  submission has no groupId', submissionId);
      return res.status(400).json({ error: 'Submission has no groupId' });
    }

    // 🔐 Check group admin rights for this group
    const dbUser = await requireGroupAdmin(req, res, groupId);
    if (!dbUser) return; // response already sent

    // Proceed with update
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

      console.log(
        `📦  created coupon ${newCoupon.id} from submission ${submissionId}`,
      );
      return res.json(newCoupon);
    }

    if (state === 'rejected') {
      return res.json(updated);
    }

    return res.json(updated);
  } catch (err) {
    console.error(`❌ Error in PUT /coupon-submissions/${submissionId}:`, err);
    next(err);
  }
});


// Helper: ensure current Cognito user is group admin (or super admin)
async function requireGroupAdmin(req, res, groupId) {
  const authedSub = req.user && req.user.sub;
  if (!authedSub) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  // 1) Local user row
  const [dbUser] = await db
    .select()
    .from(user)
    .where(eq(user.cognitoSub, authedSub));

  if (!dbUser) {
    console.warn('📦  No local user for sub', authedSub);
    res.status(403).json({ error: 'User not registered' });
    return null;
  }

  // Super admin shortcut
  if (dbUser.role === 'admin') {
    return dbUser;
  }

  // 2) Membership for this group
  const memberships = await db
    .select()
    .from(foodieGroupMembership)
    .where(
      and(
        eq(foodieGroupMembership.userId, dbUser.id),
        eq(foodieGroupMembership.groupId, groupId),
      ),
    );

  const isGroupAdmin = memberships.some((m) =>
    m.role === 'foodie_group_admin' || m.role === 'admin',
  );

  if (!isGroupAdmin) {
    console.warn(
      '📦  User is not foodie_group_admin / admin for group',
      dbUser.id,
      groupId,
    );
    res.status(403).json({ error: 'Not authorized for this group' });
    return null;
  }

  return dbUser;
}

export default router;
