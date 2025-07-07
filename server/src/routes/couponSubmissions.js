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
  console.log('📦  PUT /api/v1/coupon-submissions/' + req.params.id, req.body);
  try {
    const { state } = req.body; // 'approved' or 'rejected'
    const [updated] = await db
      .update(couponSubmissions)
      .set({ state })
      .where(eq(couponSubmissions.id, req.params.id))
      .returning();

    if (!updated) {
      console.log('📦  submission not found for update');
      return res.status(404).json({ message: 'Submission not found' });
    }

    // On approval, promote to live coupons
    if (state === 'approved') {
      const data = updated.submissionData;
      const [newCoupon] = await db
        .insert(coupons)
        .values({
          groupId:      updated.groupId,
          merchantId:   updated.merchantId,
          title:        data.title,
          description:  data.description,
          couponType:   data.coupon_type,
          discountValue:data.discount_value,
          validFrom:    new Date(data.valid_from),
          expiresAt:    new Date(data.expires_at),
          qrCodeUrl:    data.qr_code_url,
          locked:       data.locked
        })
        .returning();
      return res.json(newCoupon);
    }

    res.json(updated);
  } catch (err) {
    console.error('📦  error in PUT /coupon-submissions/:id', err);
    next(err);
  }
});

export default router;
