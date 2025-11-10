// server/src/routes/coupons.js
import express from 'express';
import { db } from '../db.js';
import { coupon, merchant, foodieGroup, couponRedemption, user } from '../schema.js';
import { eq, and } from 'drizzle-orm';
import auth from '../middleware/auth.js'; // auth() verifies Cognito token and sets req.user
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

// POST /api/v1/coupons/:id/redeem
router.post('/:id/redeem', auth(), async (req, res, next) => {
    try {
        const couponId = req.params.id;
        console.log('🎟️  Redeem attempt start', {
          couponId,
          authed: !!req.user,
          sub: req.user?.sub,
        });
  
      // 1) Ensure coupon exists
      const [c] = await db.select().from(coupon).where(eq(coupon.id, couponId));
      if (!c) {
        console.log('🎟️  Coupon not found');
        return res.status(404).json({ error: 'Coupon not found' });
      }
  
      // 2) (Optional) validity window check
      const now = new Date();
      if (c.validFrom && new Date(c.validFrom) > now) {
        console.warn('⛔ Coupon not yet valid', { couponId, validFrom: c.validFrom, now });
        return res.status(400).json({ error: 'Coupon is not yet valid' });
      }
      if (c.expiresAt && new Date(c.expiresAt) < now) {
        console.warn('⛔ Coupon expired', { couponId, expiresAt: c.expiresAt, now });
        return res.status(400).json({ error: 'Coupon is expired' });
      }
  
   // 3) Auth required: map req.user.sub -> local user row
    if (!req.user?.sub) {
      console.warn('🔒 Missing req.user.sub (JWT not verified)');
      return res.status(401).json({ error: 'Sign in required to redeem this coupon' });
    }

    // Find local user by provider sub; if not found, auto-provision or 409
    let [u] = await db.select().from(user).where(eq(user.providerSub, req.user.sub));
    if (!u) {
      console.log('👤 No local user for sub; creating', { sub: req.user.sub, email: req.user?.email });
      const insertRes = await db.insert(user).values({
        // adjust these fields to your user schema
        provider: 'cognito',
        providerSub: req.user.sub,
        email: req.user?.email ?? null,
        createdAt: new Date(),
      }).returning();
      u = insertRes[0];
    }

    // 4) One-per-user check
    const [existing] = await db
      .select()
      .from(couponRedemption)
      .where(and(eq(couponRedemption.couponId, c.id), eq(couponRedemption.userId, u.id)));

    if (existing) {
      console.log('♻️  Already redeemed; returning 200', { couponId: c.id, userId: u.id });
      return res.status(200).json({ ok: true, alreadyRedeemed: true });
    }

    // 5) Insert redemption
    const [created] = await db.insert(couponRedemption).values({
      couponId: c.id,
      userId: u.id,
      redeemedAt: new Date(),
    }).returning();

    console.log('✅ Redemption recorded', {
      redemptionId: created.id,
      couponId: c.id,
      userId: u.id,
    });
    return res.status(201).json({ ok: true, redemptionId: created.id });
    } catch (err) {
      console.error('🎟️  error in POST /api/v1/coupons/:id/redeem', err);
      next(err);
    }
  });
  
export default router;
