// server/src/routes/coupons.js
import express from 'express';
import { db } from '../db.js';
import { coupon, merchant, foodieGroup, couponRedemption, user } from '../schema.js';
import { eq, and, sql } from 'drizzle-orm';
import auth from '../middleware/auth.js'; // auth() verifies Cognito token and sets req.user

const router = express.Router();

console.log('📦  coupons router loaded');

// GET all coupons
router.get('/', async (req, res, next) => {
  try {
    const allCoupons = await db
      .select({
        id:                coupon.id,
        title:             coupon.title,
        description:       coupon.description,
        coupon_type:       coupon.couponType,
        discount_value:    coupon.discountValue,
        valid_from:        coupon.validFrom,
        expires_at:        coupon.expiresAt,
        qr_code_url:       coupon.qrCodeUrl,
        locked:            coupon.locked,
        merchant_id:       coupon.merchantId,
        merchant_name:     merchant.name,
        merchant_logo:     merchant.logoUrl,
        foodie_group_id:   coupon.groupId,
        foodie_group_name: foodieGroup.name,
      })
      .from(coupon)
      .leftJoin(merchant, eq(merchant.id, coupon.merchantId))
      .leftJoin(foodieGroup, eq(foodieGroup.id, coupon.groupId));

    res.json(allCoupons);
  } catch (err) {
    console.error('📦 error in GET /api/v1/coupons', err);

    const isPgError = err && typeof err === 'object' && ('code' in err || 'detail' in err);
    if (isPgError) {
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
  } catch (err) {
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
        couponType:    coupon_type,
        discountValue: discount_value,
        validFrom:     valid_from ? new Date(valid_from) : null,
        expiresAt:     expires_at ? new Date(expires_at) : null,
        merchantId:    merchant_id,
        groupId:       group_id,
      })
      .returning();

    res.status(201).json(newCoupon);
  } catch (err) {
    console.error('📦  error in POST /api/v1/coupons', err);
    next(err);
  }
});

// POST /api/v1/coupons/:id/redeem  (ONE canonical route)
router.post('/:id/redeem', auth(), async (req, res, next) => {
  try {
    const couponId = req.params.id;
    console.log('🎟️  Redeem attempt start', {
      couponId,
      authed: !!req.user,
      sub: req.user?.sub,
      email: req.user?.email,
    });

    // 0) Must have a verified Cognito subject
    if (!req.user?.sub) {
      console.warn('🔒 Missing req.user.sub (JWT not verified)');
      return res.status(401).json({ error: 'Sign in required to redeem this coupon' });
    }

    // 1) Ensure coupon exists
    const [c] = await db.select().from(coupon).where(eq(coupon.id, couponId));
    if (!c) {
      console.log('🎟️  Coupon not found');
      return res.status(404).json({ error: 'Coupon not found' });
    }

    // 2) validity window check
    const now = new Date();
    if (c.validFrom && new Date(c.validFrom) > now) {
      console.warn('⛔ Coupon not yet valid', { couponId, validFrom: c.validFrom, now });
      return res.status(400).json({ error: 'Coupon is not yet valid' });
    }
    if (c.expiresAt && new Date(c.expiresAt) < now) {
      console.warn('⛔ Coupon expired', { couponId, expiresAt: c.expiresAt, now });
      return res.status(400).json({ error: 'Coupon is expired' });
    }

    // 3) Map Cognito subject -> local user row via *cognitoSub*
    let [u] = await db.select().from(user).where(eq(user.cognitoSub, req.user.sub));
    if (!u) {
      console.log('👤 No local user; creating', { sub: req.user.sub, email: req.user?.email });

      const safeName =
        req.user?.name ||
        (req.user?.email ? req.user.email.split('@')[0] : 'user-' + req.user.sub.slice(0, 6));

      const safeEmail = req.user?.email || `${req.user.sub}@unknown.local`;

      const inserted = await db
        .insert(user)
        .values({
          cognitoSub: req.user.sub,
          email:      safeEmail,
          name:       safeName,
        })
        .returning();
      u = inserted[0];
    }

    // 4) One-per-user check
    const [existing] = await db
      .select()
      .from(couponRedemption)
      .where(
        and(
          eq(couponRedemption.couponId, c.id),
          eq(couponRedemption.userId, u.id),
        ),
      );

    if (existing) {
      console.log('♻️  Already redeemed; returning 200', {
        couponId: c.id,
        userId:   u.id,
      });
      return res.status(200).json({
        ok:              true,
        alreadyRedeemed: true,
        redeemed_at:
          existing.redeemedAt?.toISOString?.() || existing.redeemedAt || null,
      });
    }

    // 5) Insert redemption
    const nowIso = new Date();
    const [created] = await db
      .insert(couponRedemption)
      .values({
        couponId:  c.id,
        userId:    u.id,
        redeemedAt: nowIso,
      })
      .returning();

    console.log('✅ Redemption recorded', {
      redemptionId: created.id,
      couponId:     c.id,
      userId:       u.id,
    });

    return res.status(201).json({
      ok:            true,
      redemptionId:  created.id,
      redeemed_at:   nowIso.toISOString(),
    });
  } catch (err) {
    console.error('🎟️  error in POST /api/v1/coupons/:id/redeem', err);
    next(err);
  }
});

// GET /api/v1/coupons/redemptions/merchant-insights
// Summary of redemptions for all coupons at restaurants owned by the authed user
router.get('/redemptions/merchant-insights', auth(), async (req, res, next) => {
  try {
    if (!req.user?.sub) {
      return res.status(401).json({ error: 'Sign in required' });
    }

    // Ensure we have a local user row for this Cognito subject
    let [u] = await db.select().from(user).where(eq(user.cognitoSub, req.user.sub));
    if (!u) {
      const safeName =
        req.user?.name ||
        (req.user?.email ? req.user.email.split('@')[0] : 'user-' + req.user.sub.slice(0, 6));

      const safeEmail = req.user?.email || `${req.user.sub}@unknown.local`;

      const inserted = await db
        .insert(user)
        .values({
          cognitoSub: req.user.sub,
          email:      safeEmail,
          name:       safeName,
        })
        .returning();
      u = inserted[0];
    }

    // Aggregate redemptions per coupon for merchants this user owns
    const rows = await db
      .select({
        merchantId:     merchant.id,
        merchantName:   merchant.name,
        couponId:       coupon.id,
        couponTitle:    coupon.title,
        redemptions:    sql`count(${couponRedemption.id})`.as('redemptions'),
        lastRedeemedAt: sql`max(${couponRedemption.redeemedAt})`.as('last_redeemed_at'),
      })
      .from(couponRedemption)
      .innerJoin(coupon,   eq(coupon.id, couponRedemption.couponId))
      .innerJoin(merchant, eq(merchant.id, coupon.merchantId))
      .where(eq(merchant.ownerId, u.id))
      .groupBy(merchant.id, merchant.name, coupon.id, coupon.title);

    res.json(rows);
  } catch (err) {
    console.error('🎟️  error in GET /api/v1/coupons/redemptions/merchant-insights', err);
    next(err);
  }
});

// GET /api/v1/coupons/redemptions/me
router.get('/redemptions/me', auth(), async (req, res, next) => {
  try {
    if (!req.user?.sub) {
      return res.status(401).json({ error: 'Sign in required' });
    }

    // Find or create local user (same as in redeem route)
    let [u] = await db.select().from(user).where(eq(user.cognitoSub, req.user.sub));
    if (!u) {
      const safeName =
        req.user?.name ||
        (req.user?.email ? req.user.email.split('@')[0] : 'user-' + req.user.sub.slice(0, 6));

      const safeEmail = req.user?.email || `${req.user.sub}@unknown.local`;

      const inserted = await db
        .insert(user)
        .values({
          cognitoSub: req.user.sub,
          email:      safeEmail,
          name:       safeName,
        })
        .returning();
      u = inserted[0];
    }

    const rows = await db
      .select({
        couponId:   couponRedemption.couponId,
        redeemedAt: couponRedemption.redeemedAt,
      })
      .from(couponRedemption)
      .where(eq(couponRedemption.userId, u.id));

    res.json(rows);
  } catch (err) {
    console.error('🎟️  error in GET /api/v1/coupons/redemptions/me', err);
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
  } catch (err) {
    console.error('📦  error in DELETE /api/v1/coupons/:id', err);
    next(err);
  }
});

export default router;
