// server/src/routes/coupons.js
import express from 'express';
import { db } from '../db.js';
import { coupon, merchant, foodieGroup } from '../schema.js';
import { eq } from 'drizzle-orm';
const router = express.Router();
console.log('📦  coupons router loaded');
// GET all coupons
router.get('/', async (req, res, next) => {
    try {
      const allCoupons = await db
        .select({
          id:               coupon.id,
          title:            coupon.title,
          description:      coupon.description,
          coupon_type:      coupon.couponType,
          discount_value:   coupon.discountValue,
          valid_from:       coupon.validFrom,
          expires_at:       coupon.expiresAt,
          qr_code_url:      coupon.qrCodeUrl,
          locked:           coupon.locked,
          merchant_id:      coupon.merchantId,
          merchant_name:    merchant.name,
          merchant_logo:    merchant.logoUrl,
          foodie_group_id:   coupon.groupId,
          foodie_group_name: foodieGroup.name,
        })
        .from(coupon)
        .leftJoin(merchant, eq(merchant.id, coupon.merchantId))
        .leftJoin(foodieGroup, eq(foodieGroup.id, coupon.groupId));
  
      res.json(allCoupons);
    } catch (err) {
      console.error('📦 error in GET /api/v1/coupons', err);
  
      // Try to surface PG-ish fields if present
      const isPgError = err && typeof err === 'object' && ('code' in err || 'detail' in err);
      if (isPgError) {
        // e.g. code "42P01" -> relation does not exist
        return res.status(500).json({
          error: 'DB_ERROR',
          code: err.code ?? null,
          message: err.message ?? String(err),
          detail: err.detail ?? null,
          table: err.table ?? null,
          schema: err.schema ?? null,
        });
      }
  
      return res.status(500).json({ error: err?.message || 'Server error' });
    }
  });
  
// GET a single coupon by ID
router.get('/:id', async (req, res, next) => {
    console.log('📦  GET /api/v1/coupons/' + req.params.id);
    try {
        const [found] = await db
            .select()
            .from(coupon)
            .where(eq(coupon.id, req.params.id));
        if (!found) {
            console.log('📦  coupon not found');
            return res.status(404).json({ message: 'Coupon not found' });
        }
        res.json(found);
    }
    catch (err) {
        console.error('📦  error in GET /api/v1/coupons/:id', err);
        next(err);
    }
});
// POST /api/v1/coupons
router.post('/', async (req, res, next) => {
    console.log('📦  POST /api/v1/coupons', req.body);
    try {
        const { 
            title, 
            description, 
            coupon_type, 
            discount_value, 
            valid_from, 
            expires_at, 
            merchant_id, 
            group_id, 
            } = req.body;
        const [newCoupon] = await db
            .insert(coupon)
            .values({
            title,
            description,
            couponType: coupon_type,
            discountValue: discount_value,
            validFrom: new Date(valid_from),
            expiresAt: new Date(expires_at),
            merchantId: merchant_id,
            groupId: group_id,
        })
            .returning();
        res.status(201).json(newCoupon);
    }
    catch (err) {
        console.error('📦  error in POST /api/v1/coupons', err);
        next(err);
    }
});
// PUT /api/v1/coupons/:id
router.put('/:id', async (req, res, next) => {
    console.log('📦  PUT /api/v1/coupons/' + req.params.id, req.body);
    try {
        const updates = { ...req.body };
        if (updates.valid_from)
            updates.validFrom = new Date(updates.valid_from);
        if (updates.expires_at)
            updates.expiresAt = new Date(updates.expires_at);
        const [updated] = await db
            .update(coupon)
            .set(updates)
            .where(eq(coupon.id, req.params.id))
            .returning();
        if (!updated) {
            console.log('📦  coupon not found for update');
            return res.status(404).json({ message: 'Coupon not found' });
        }
        console.log('📦  updated coupon id:', updated.id);
        res.json(updated);
    }
    catch (err) {
        console.error('📦  error in PUT /api/v1/coupons/:id', err);
        next(err);
    }
});
// DELETE /api/v1/coupons/:id
router.delete('/:id', async (req, res, next) => {
    console.log('📦  DELETE /api/v1/coupons/' + req.params.id);
    try {
        const result = await db
            .delete(coupon)
            .where(eq(coupon.id, req.params.id));
        if (!result.count) {
            console.log('📦  coupon not found for delete');
            return res.status(404).json({ message: 'Coupon not found' });
        }
        console.log('📦  deleted coupon count:', result.count);
        res.json({ message: 'Coupon deleted' });
    }
    catch (err) {
        console.error('📦  error in DELETE /api/v1/coupons/:id', err);
        next(err);
    }
});
export default router;
