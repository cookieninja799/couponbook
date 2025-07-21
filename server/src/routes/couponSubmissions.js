// src/routes/couponSubmissions.js
import express from 'express';
import { db } from '../db.js';
import { couponSubmissions, coupons, merchants} from '../schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

console.log('📦  couponSubmissions router loaded');

// ─── GET all submissions, or only for one group ─────────────────
router.get('/', async (req, res, next) => {
    console.log('📦  GET /api/v1/coupon-submissions hit', req.query);
    try {
      const { groupId } = req.query;
  
      // start your query
      let q = db
        .select({
          id:             couponSubmissions.id,
          groupId:        couponSubmissions.groupId,
          merchantId:     couponSubmissions.merchantId,
          merchantName:   merchants.name,
          state:          couponSubmissions.state,
          submittedAt:    couponSubmissions.submittedAt,
          submissionData: couponSubmissions.submissionData,
          deletedAt:      couponSubmissions.deletedAt
        })
        .from(couponSubmissions)
        .leftJoin(merchants, eq(merchants.id, couponSubmissions.merchantId))
        .where(eq(couponSubmissions.state, 'pending'));  
      // if the client passed ?groupId=..., filter by it
      if (groupId) {
        q = q.where(eq(couponSubmissions.groupId, groupId));
      }
  
      const subs = await q;
      console.log(`📦  returning ${subs.length} submissions`);
      res.json(subs);
    } catch (err) {
      console.error('📦  error in GET /coupon-submissions', err);
      next(err);
    }
  });

// ─── GET a single submission by ID ──────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  console.log('📦  GET /api/v1/coupon-submissions/' + req.params.id);
  try {
    const [sub] = await db
      .select()
      .from(couponSubmissions)
      .where(eq(couponSubmissions.id, req.params.id));
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

// ─── POST new submission ────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  console.log('📦  POST /api/v1/coupon-submissions', req.body);
  try {
    const { group_id, merchant_id, submission_data } = req.body;
    const [newSub] = await db
      .insert(couponSubmissions)
      .values({
        groupId:        group_id,
        merchantId:     merchant_id,
        state:          'pending',
        submissionData: submission_data
      })
      .returning();
    res.status(201).json(newSub);
  } catch (err) {
    console.error('📦  error in POST /coupon-submissions', err);
    if (err.cause) console.error('PG error:', err.cause.message);
    return res
      .status(500)
      .json({ error: err.message, detail: err.cause?.message });
    next(err);
  }
});

// ─── PUT update submission (approve/reject) ─────────────────────────────
router.put('/:id', async (req, res, next) => {
  const submissionId = req.params.id;
  const { state, message } = req.body; // message only used on reject
  console.log(`📦  PUT /api/v1/coupon-submissions/${submissionId}`, { state, message });

  try {
    // 1) Update state (and rejectionMessage if provided)
    const updateData = { state };
    if (state === 'rejected' && message) {
      updateData.rejectionMessage = message;
    }

    const [updated] = await db
      .update(couponSubmissions)
      .set(updateData)
      .where(eq(couponSubmissions.id, submissionId))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    console.log(`📦  submission ${submissionId} updated to "${state}"`);

    // 2) Approved? promote to live coupon + notify merchant
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
        .insert(coupons)
        .values(couponPayload)
        .returning();

      console.log(`📦  created coupon ${newCoupon.id} from submission ${submissionId}`);

      // fire-and-forget notification
      (async () => {
        try {
          await fetch(
            'https://n8n.vivaspot.com/webhook-test/65d14fa4-31fc-461e-86b6-367d303ff1b9',
            {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                submissionId,
                groupId,
                merchantId,
                coupon: newCoupon,
              }),
            }
          );
          console.log('📦  approval webhook sent');
        } catch (err) {
          console.error('❌ approval webhook error:', err);
        }
      })();

      return res.json(newCoupon);
    }

    // 3) Rejected? notify merchant with message
    if (state === 'rejected') {
      (async () => {
        try {
          await fetch(
            'https://n8n.vivaspot.com/webhook-test/6705fb4b-ba61-4189-a10b-304a0600a86e',
            {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                submissionId,
                groupId:    updated.groupId,
                merchantId: updated.merchantId,
                message:    updated.rejectionMessage,
              }),
            }
          );
          console.log('📦  rejection webhook sent');
        } catch (err) {
          console.error('❌ rejection webhook error:', err);
        }
      })();

      return res.json(updated);
    }

    // 4) Other states (if any)
    return res.json(updated);

  } catch (err) {
    console.error(`❌ Error in PUT /coupon-submissions/${submissionId}:`, err);
    next(err);
  }
});

export default router;
