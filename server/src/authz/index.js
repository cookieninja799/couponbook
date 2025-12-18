import { db } from '../db.js';
import * as schema from '../schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * resolveLocalUser:
 * Middleware that fetches the DB user by Cognito sub and attaches it to req.user.
 * Requires the standard auth middleware to have already run.
 */
export async function resolveLocalUser(req, res, next) {
  if (!req.user || !req.user.sub) {
    return res.status(401).json({ message: 'Unauthorized: No valid session' });
  }

  try {
    const [user] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.cognitoSub, req.user.sub))
      .limit(1);

    if (!user) {
      console.warn(`User with sub ${req.user.sub} not found in DB; creating on-the-fly`);
      
      const safeName =
        req.user.name ||
        (req.user.email ? req.user.email.split('@')[0] : 'user-' + req.user.sub.slice(0, 6));

      const safeEmail = req.user.email || `${req.user.sub}@unknown.local`;

      const [newUser] = await db
        .insert(schema.user)
        .values({
          cognitoSub: req.user.sub,
          email:      safeEmail,
          name:       safeName,
          role:       'customer',
        })
        .returning();
      
      req.dbUser = newUser;
      return next();
    }

    // Attach full DB user record
    req.dbUser = user;
    next();
  } catch (err) {
    console.error('Failed to resolve local user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * requireAdmin:
 * Middleware that ensures the dbUser has the 'admin' role.
 */
export function requireAdmin(req, res, next) {
  if (req.dbUser?.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  next();
}

/**
 * canManageMerchant:
 * Returns true if the user is a global admin OR the owner of the merchant.
 */
export async function canManageMerchant(dbUser, merchantId) {
  if (!dbUser || !merchantId) return false;
  if (dbUser.role === 'admin') return true;

  const [merchant] = await db
    .select({ ownerId: schema.merchant.ownerId })
    .from(schema.merchant)
    .where(eq(schema.merchant.id, merchantId))
    .limit(1);

  return merchant?.ownerId === dbUser.id;
}

/**
 * canManageCoupon:
 * Returns true if the user is a global admin OR the owner of the coupon's merchant.
 */
export async function canManageCoupon(dbUser, couponId) {
  if (!dbUser || !couponId) return false;
  if (dbUser.role === 'admin') return true;

  const [couponWithMerchant] = await db
    .select({ merchantOwnerId: schema.merchant.ownerId })
    .from(schema.coupon)
    .innerJoin(schema.merchant, eq(schema.coupon.merchantId, schema.merchant.id))
    .where(eq(schema.coupon.id, couponId))
    .limit(1);

  return couponWithMerchant?.merchantOwnerId === dbUser.id;
}

/**
 * canManageGroup:
 * Returns true if global admin OR has 'foodie_group_admin' role in that specific group.
 */
export async function canManageGroup(dbUser, groupId) {
  if (!dbUser || !groupId) return false;
  if (dbUser.role === 'admin') return true;

  const [membership] = await db
    .select({ role: schema.foodieGroupMembership.role })
    .from(schema.foodieGroupMembership)
    .where(
      and(
        eq(schema.foodieGroupMembership.userId, dbUser.id),
        eq(schema.foodieGroupMembership.groupId, groupId)
      )
    )
    .limit(1);

  return membership?.role === 'foodie_group_admin';
}

/**
 * hasEntitlement:
 * Returns true if the user has access to the given group's locked coupons.
 * (e.g. they have a paid purchase for this group or are an admin)
 */
export async function hasEntitlement(dbUser, groupId) {
  if (!dbUser || !groupId) return false;
  if (dbUser.role === 'admin') return true;

  // 1) Check for active purchase in this group
  const [activePurchase] = await db
    .select()
    .from(schema.purchase)
    .where(
      and(
        eq(schema.purchase.userId, dbUser.id),
        eq(schema.purchase.groupId, groupId),
        eq(schema.purchase.status, 'paid')
      )
    )
    .limit(1);
  
  if (activePurchase) return true;

  // 2) Check for group admin role in this group
  const isGAdmin = await canManageGroup(dbUser, groupId);
  if (isGAdmin) return true;

  return false;
}
