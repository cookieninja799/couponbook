// server/src/routes/coupons.js
import express from 'express';
import { db } from '../db.js';
import { coupons } from '../schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

console.log('📦  coupons router loaded');

router.get('/', async (req, res, next) => {
  console.log('📦  GET /api/v1/coupons hit');
  try {
    const allCoupons = await db.select().from(coupons);
    console.log(`📦  returning ${allCoupons.length} coupons`);
    res.json(allCoupons);
  } catch (err) {
    console.error('📦  error in GET /coupons', err);
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  console.log('📦  GET /api/v1/coupons/' + req.params.id);
  try {
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, Number(req.params.id)));
    if (!coupon) {
      console.log('📦  coupon not found');
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.json(coupon);
  } catch (err) {
    console.error('📦  error in GET /coupons/:id', err);
    next(err);
  }
});

// ─── POST /api/v1/coupons ───────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  console.log('📦  POST /api/v1/coupons', req.body);
  try {
    const {
      title,
      description,
      coupon_type,     // incoming snake_case
      discount_value,
      valid_from,
      expires_at,
      merchant_id,
      group_id,
    } = req.body;

    const [newCoupon] = await db
      .insert(coupons)
      .values({
        title,
        description,
        couponType:   coupon_type,      // ← Drizzle field
        discountValue: discount_value,  // ← Drizzle field
        validFrom:    new Date(valid_from),
        expiresAt:    new Date(expires_at),
        merchantId:   merchant_id,      // ← Drizzle field
        groupId:      group_id,         // ← Drizzle field
      })
      .returning();

    res.status(201).json(newCoupon);
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/v1/coupons/:id ───────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  console.log('📦  PUT /api/v1/coupons/' + req.params.id, req.body);
  try {
    const updates = { ...req.body };
    if (updates.valid_from)  updates.valid_from  = new Date(updates.valid_from);
    if (updates.expires_at) updates.expires_at = new Date(updates.expires_at);

    const [updated] = await db
      .update(coupons)
      .set(updates)
      .where(eq(coupons.id, Number(req.params.id)))
      .returning();

    if (!updated) {
      console.log('📦  coupon not found for update');
      return res.status(404).json({ message: 'Coupon not found' });
    }
    console.log('📦  updated coupon id:', updated.id);
    res.json(updated);
  } catch (err) {
    console.error('📦  error in PUT /coupons/:id', err);
    next(err);
  }
});

// ─── DELETE /api/v1/coupons/:id ────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  console.log('📦  DELETE /api/v1/coupons/' + req.params.id);
  try {
    const result = await db.delete(coupons).where(eq(coupons.id, Number(req.params.id)));
    if (!result.count) {
      console.log('📦  coupon not found for delete');
      return res.status(404).json({ message: 'Coupon not found' });
    }
    console.log('📦  deleted coupon count:', result.count);
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    console.error('📦  error in DELETE /coupons/:id', err);
    next(err);
  }
});

export default router;
