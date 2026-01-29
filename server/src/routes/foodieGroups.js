// server/src/routes/foodieGroup.js
import express from 'express';
import { db } from '../db.js';
import { foodieGroup, purchase, user, foodieGroupMembership, couponBookPrice } from '../schema.js';
import { eq, and, count, isNull, or, sql } from 'drizzle-orm';
import auth from '../middleware/auth.js';
import { resolveLocalUser, requireAdmin, canManageGroup } from '../authz/index.js';
import { stripe } from '../config/stripe.js';

const router = express.Router();

console.log('📦  foodieGroup router loaded');

// ─── GET /api/v1/groups ───────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  console.log('📦  GET /api/v1/groups hit');
  try {
    const allGroups = await db.select().from(foodieGroup);
    console.log(`📦  returning ${allGroups.length} groups`);
    res.json(allGroups);
  } catch (err) {
    console.error('📦  error in GET /groups', err);
    next(err);
  }
});

// ─── GET /api/v1/groups/:id ───────────────────────────────────────────
// :id can be either a UUID or a slug
router.get('/:id', async (req, res, next) => {
  try {
    const groupIdOrSlug = req.params.id;

    // Support both UUID and slug lookups
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupIdOrSlug);

    const [groupRow] = await db
      .select()
      .from(foodieGroup)
      .where(isUUID ? eq(foodieGroup.id, groupIdOrSlug) : eq(foodieGroup.slug, groupIdOrSlug));

      if (!groupRow) {
        return res.status(404).json({ error: 'Foodie group not found' });
      }

      const groupId = groupRow.id;
  
      // Get member count
      const [membershipAgg] = await db
        .select({
          memberCount: count(),
        })
        .from(foodieGroupMembership)
        .where(
          and(
            eq(foodieGroupMembership.groupId, groupId),
            isNull(foodieGroupMembership.deletedAt),
          ),
        );
  
      const totalMembers = membershipAgg?.memberCount ?? 0;  
      
      return res.json({
        ...groupRow,
        totalMembers,
      });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/v1/groups/:id/price ─────────────────────────────────────
// Public endpoint to get the current price for a group's coupon book
// :id can be either a UUID or a slug
router.get('/:id/price', async (req, res, next) => {
  const groupIdOrSlug = req.params.id;
  console.log('📦  GET /api/v1/groups/:id/price', { groupIdOrSlug });

  try {
    // Support both UUID and slug lookups
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupIdOrSlug);

    const [groupRow] = await db
      .select()
      .from(foodieGroup)
      .where(isUUID ? eq(foodieGroup.id, groupIdOrSlug) : eq(foodieGroup.slug, groupIdOrSlug));

    if (!groupRow) {
      return res.status(404).json({ error: 'Foodie group not found' });
    }

    const groupId = groupRow.id;

    // Look up active price for this group
    const [activePrice] = await db
      .select()
      .from(couponBookPrice)
      .where(
        and(
          eq(couponBookPrice.groupId, groupId),
          eq(couponBookPrice.isActive, true)
        )
      );

    if (!activePrice) {
      // No price configured - return fallback (Chapel Hill default: $9.99)
      return res.json({
        available: true,
        amountCents: 999,
        currency: 'usd',
        display: '$9.99',
        isDefault: true,
      });
    }

    const display = formatPrice(activePrice.amountCents, activePrice.currency);
    return res.json({
      available: true,
      amountCents: activePrice.amountCents,
      currency: activePrice.currency,
      display,
      stripePriceId: activePrice.stripePriceId,
      isDefault: false,
    });
  } catch (err) {
    console.error('📦  error in GET /groups/:id/price', err);
    next(err);
  }
});

// ─── PUT /api/v1/groups/:id/price ─────────────────────────────────────
// Admin endpoint to update coupon book pricing
router.put('/:id/price', auth(), async (req, res, next) => {
  const groupIdOrSlug = req.params.id;
  const { amountCents, currency = 'usd' } = req.body;

  console.log('📦  PUT /api/v1/groups/:id/price', { groupIdOrSlug, amountCents, currency });

  try {
    const sub = req.user && req.user.sub;
    if (!sub) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1) Look up local user
    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.cognitoSub, sub));

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2) Resolve group by UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupIdOrSlug);

    const [groupRow] = await db
      .select()
      .from(foodieGroup)
      .where(isUUID ? eq(foodieGroup.id, groupIdOrSlug) : eq(foodieGroup.slug, groupIdOrSlug));

    if (!groupRow) {
      return res.status(404).json({ error: 'Foodie group not found' });
    }

    const groupId = groupRow.id;

    // 3) Authorization: must be foodie_group_admin for this group OR super_admin
    const isGroupAdmin = await checkFoodieGroupAdmin(dbUser.id, groupId);
    const isSuperAdmin = dbUser.role === 'super_admin';

    if (!isGroupAdmin && !isSuperAdmin) {
      return res.status(403).json({ error: 'Not authorized to manage pricing' });
    }

    // 4) Validate price amount (min $0.50 = 50 cents, max $999.99 = 99999 cents)
    if (!amountCents || typeof amountCents !== 'number') {
      return res.status(400).json({ error: 'amountCents is required and must be a number' });
    }
    if (amountCents < 50 || amountCents > 99999) {
      return res.status(400).json({ error: 'Price must be between $0.50 and $999.99' });
    }

    // 5) Get existing active price (if any) to reuse Stripe Product
    const [existingPrice] = await db
      .select()
      .from(couponBookPrice)
      .where(
        and(
          eq(couponBookPrice.groupId, groupId),
          eq(couponBookPrice.isActive, true)
        )
      );

    // 6) Get or create Stripe Product
    let stripeProductId = existingPrice?.stripeProductId;

    if (!stripeProductId) {
      console.log('📦  Creating new Stripe Product for group', groupId);
      const product = await stripe.products.create({
        name: `${groupRow.name} Coupon Book`,
        description: `Access to exclusive coupons and events for ${groupRow.name}`,
        metadata: { groupId, groupSlug: groupRow.slug }
      });
      stripeProductId = product.id;
    }

    // 7) Create new Stripe Price (prices are immutable in Stripe)
    console.log('📦  Creating new Stripe Price', { stripeProductId, amountCents, currency });
    const stripePrice = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: amountCents,
      currency: currency.toLowerCase(),
      metadata: { groupId, groupSlug: groupRow.slug }
    });

    // 8) Database transaction: deactivate old price, insert new active price
    // Using raw SQL for the transaction since Drizzle transactions can be tricky
    const now = new Date().toISOString();

    // Deactivate existing active price(s)
    if (existingPrice) {
      await db
        .update(couponBookPrice)
        .set({ 
          isActive: false, 
          archivedAt: now,
          updatedAt: now 
        })
        .where(
          and(
            eq(couponBookPrice.groupId, groupId),
            eq(couponBookPrice.isActive, true)
          )
        );
    }

    // Insert new active price
    const [newPrice] = await db
      .insert(couponBookPrice)
      .values({
        groupId,
        amountCents,
        currency: currency.toLowerCase(),
        isActive: true,
        stripeProductId,
        stripePriceId: stripePrice.id,
        createdByUserId: dbUser.id,
      })
      .returning();

    console.log('📦  Price updated successfully', {
      priceId: newPrice.id,
      stripePriceId: stripePrice.id,
    });

    // 9) Return updated price
    return res.json({
      id: newPrice.id,
      amountCents,
      currency: currency.toLowerCase(),
      display: formatPrice(amountCents, currency),
      stripePriceId: stripePrice.id,
      stripeProductId,
    });
  } catch (err) {
    console.error('📦  error in PUT /groups/:id/price', err);
    next(err);
  }
});

// Helper: Check if user is a foodie_group_admin for a specific group
async function checkFoodieGroupAdmin(userId, groupId) {
  const [membership] = await db
    .select()
    .from(foodieGroupMembership)
    .where(
      and(
        eq(foodieGroupMembership.userId, userId),
        eq(foodieGroupMembership.groupId, groupId),
        eq(foodieGroupMembership.role, 'foodie_group_admin'),
        isNull(foodieGroupMembership.deletedAt)
      )
    );
  return !!membership;
}

// ─── POST /api/v1/groups/:id/checkout ─────────────────────────────────
// Create a Stripe Checkout Session for purchasing the coupon book
// :id can be either a UUID or a slug
router.post('/:id/checkout', auth(), async (req, res, next) => {
  const groupIdOrSlug = req.params.id;
  console.log('📦  POST /api/v1/groups/:id/checkout', { groupIdOrSlug });

  try {
    const sub = req.user && req.user.sub;
    if (!sub) {
      console.warn('📦  /groups/:id/checkout called without Cognito sub');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 0) Resolve group ID from UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupIdOrSlug);

    const [resolvedGroup] = await db
      .select()
      .from(foodieGroup)
      .where(isUUID ? eq(foodieGroup.id, groupIdOrSlug) : eq(foodieGroup.slug, groupIdOrSlug));

    if (!resolvedGroup) {
      return res.status(404).json({ error: 'Foodie group not found' });
    }

    const groupId = resolvedGroup.id;

    // 1) Look up local user row by Cognito sub
    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.cognitoSub, sub));

    if (!dbUser) {
      console.warn('📦  No local user row for sub', sub);
      return res.status(404).json({ error: 'User not found. Please complete registration.' });
    }

    // 2) Check if user already has an active/pending purchase for this group
    const existingPurchases = await db
      .select()
      .from(purchase)
      .where(
        and(
          eq(purchase.userId, dbUser.id),
          eq(purchase.groupId, groupId),
          or(
            eq(purchase.status, 'paid'),
            eq(purchase.status, 'pending')
          )
        )
      );

    if (existingPurchases.length > 0) {
      const existing = existingPurchases[0];
      if (existing.status === 'paid') {
        return res.status(400).json({ 
          error: 'You already own this coupon book.',
          hasAccess: true 
        });
      }
      // If pending, could return the existing checkout URL or create a new session
      // For simplicity, we'll create a new session (old one will expire)
    }

    // 3) Use the already-resolved group info
    const groupRow = resolvedGroup;

    // 4) Get active price for this group
    const [activePrice] = await db
      .select()
      .from(couponBookPrice)
      .where(
        and(
          eq(couponBookPrice.groupId, groupId),
          eq(couponBookPrice.isActive, true)
        )
      );

    // Determine price to use (active price or default)
    let amountCents = 999; // Default $9.99
    let currency = 'usd';
    let stripePriceId = null;
    let couponBookPriceId = null;

    if (activePrice && activePrice.stripePriceId) {
      amountCents = activePrice.amountCents;
      currency = activePrice.currency;
      stripePriceId = activePrice.stripePriceId;
      couponBookPriceId = activePrice.id;
    }

    // 5) Build success and cancel URLs
    const baseUrl = process.env.APP_URL || 'http://localhost:8080';
    const successUrl = `${baseUrl}/checkout/success/${groupRow.slug}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/foodie-group/${groupRow.slug}?cancelled=true`;

    // 6) Create Stripe Checkout Session
    let session;
    
    if (stripePriceId) {
      // Use existing Stripe Price
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
          price: stripePriceId,
          quantity: 1,
        }],
        client_reference_id: dbUser.id,
        customer_email: dbUser.email,
        metadata: {
          userId: dbUser.id,
          groupId: groupId,
          groupSlug: groupRow.slug,
          couponBookPriceId: couponBookPriceId,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    } else {
      // Create ad-hoc price (for groups without configured Stripe Price)
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: currency,
            product_data: {
              name: `${groupRow.name} Coupon Book`,
              description: `Access to exclusive coupons and events for ${groupRow.name}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        }],
        client_reference_id: dbUser.id,
        customer_email: dbUser.email,
        metadata: {
          userId: dbUser.id,
          groupId: groupId,
          groupSlug: groupRow.slug,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    }

    // 7) Insert purchase row with status='pending'
    const priceSnapshot = {
      amountCents,
      currency,
      stripePriceId,
      couponBookPriceId,
    };

    await db.insert(purchase).values({
      userId: dbUser.id,
      groupId: groupId,
      provider: 'stripe',
      stripeCheckoutId: session.id,
      amountCents: amountCents,
      currency: currency,
      status: 'pending',
      priceSnapshot: priceSnapshot,
      metadata: {
        checkoutSessionUrl: session.url,
        createdVia: 'checkout-endpoint',
      },
    });

    console.log('📦  Created Stripe checkout session', {
      sessionId: session.id,
      userId: dbUser.id,
      groupId: groupId,
    });

    // 8) Return checkout URL
    return res.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    console.error('📦  error in POST /groups/:id/checkout', err);
    next(err);
  }
});

// Helper function to format price for display
function formatPrice(amountCents, currency = 'usd') {
  const amount = amountCents / 100;
  if (currency.toLowerCase() === 'usd') {
    return `$${amount.toFixed(2)}`;
  }
  return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
}

// ─── POST /api/v1/groups ──────────────────────────────────────────────
// Secured: Only super_admin can create groups
router.post('/', auth(), resolveLocalUser, requireAdmin, async (req, res, next) => {
  console.log('📦  POST /api/v1/groups', req.body);
  try {
    const { name, description, slug } = req.body;

    // Generate slug from name if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const [newGroup] = await db
      .insert(foodieGroup)
      .values({
        name,
        description,
        slug: finalSlug,
      })
      .returning();

    res.status(201).json(newGroup);
  } catch (err) {
    console.error('📦  error in POST /groups', err);
    next(err);
  }
});

// ─── PUT /api/v1/groups/:id ───────────────────────────────────────────
// Secured: super_admin OR foodie_group_admin for this specific group
router.put('/:id', auth(), resolveLocalUser, async (req, res, next) => {
  console.log('📦  PUT /api/v1/groups/' + req.params.id, req.body);
  try {
    // Authorization check
    const allowed = await canManageGroup(req.dbUser, req.params.id);
    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden: Cannot manage this group' });
    }

    const updates = {};
    if (req.body.name        !== undefined) updates.name        = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;

    const [updated] = await db
      .update(foodieGroup)
      .set(updates)
      .where(eq(foodieGroup.id, req.params.id))
      .returning();

    if (!updated) {
      console.log('📦  group not found for update');
      return res.status(404).json({ message: 'Group not found' });
    }
    console.log('📦  updated group id:', updated.id);
    res.json(updated);
  } catch (err) {
    console.error('📦  error in PUT /groups/:id', err);
    next(err);
  }
});

// ─── DELETE /api/v1/groups/:id ────────────────────────────────────────
// Secured: Only super_admin can delete groups
router.delete('/:id', auth(), resolveLocalUser, requireAdmin, async (req, res, next) => {
  console.log('📦  DELETE /api/v1/groups/' + req.params.id);
  try {
    const result = await db
      .delete(foodieGroup)
      .where(eq(foodieGroup.id, req.params.id));

    if (!result.rowCount) {
      console.log('📦  group not found for delete');
      return res.status(404).json({ message: 'Group not found' });
    }
    console.log('📦  deleted group count:', result.rowCount);
    res.json({ message: 'Group deleted' });
  } catch (err) {
    console.error('📦  error in DELETE /groups/:id', err);
    next(err);
  }
});

// GET /api/v1/groups/:id/access
// Returns { hasAccess: boolean } based on DB-backed purchases
// :id can be either a UUID or a slug
router.get('/:id/access', auth(), async (req, res, next) => {
  const groupIdOrSlug = req.params.id;
  console.log('📦  GET /api/v1/groups/:id/access', { groupIdOrSlug });

  try {
    const sub = req.user && req.user.sub;
    if (!sub) {
      console.warn('📦  /groups/:id/access called without Cognito sub');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1) Look up the group by UUID or slug to get the actual group ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupIdOrSlug);
    
    const [groupRow] = await db
      .select()
      .from(foodieGroup)
      .where(isUUID ? eq(foodieGroup.id, groupIdOrSlug) : eq(foodieGroup.slug, groupIdOrSlug));

    if (!groupRow) {
      console.warn('📦  Group not found for access check', { groupIdOrSlug });
      return res.status(404).json({ error: 'Foodie group not found' });
    }

    const groupId = groupRow.id;

    // 2) Look up local user row by Cognito sub
    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.cognitoSub, sub));

    if (!dbUser) {
      console.warn('📦  No local user row for sub', sub);
      return res.json({ hasAccess: false });
    }

    // 3) Check for a paid purchase for this group (optimized: select only id, limit 1)
    // Filter for paid status and non-expired (expiresAt is null or in the future)
    const now = new Date().toISOString();
    const [purchaseRow] = await db
      .select({ id: purchase.id })
      .from(purchase)
      .where(
        and(
          eq(purchase.userId, dbUser.id),
          eq(purchase.groupId, groupId),
          eq(purchase.status, 'paid'),
          or(
            isNull(purchase.expiresAt),
            sql`${purchase.expiresAt} > ${now}`
          )
        )
      )
      .limit(1);

    const hasAccess = !!purchaseRow;

    // 4) If they have access, ensure membership row exists
    if (hasAccess) {
      try {
        await ensureFoodieGroupMembership(dbUser.id, groupId);
      } catch (e) {
        console.error('📦  Failed to ensure foodie group membership', {
          userId: dbUser.id,
          groupId,
          error: e,
        });
        // Do NOT fail the access check because of membership sync
      }
    }

    return res.json({ hasAccess });
  } catch (err) {
    console.error('📦  error in GET /groups/:id/access', err);
    next(err);
  }
});

// ─── POST /api/v1/groups/:id/test-purchase ────────────────────────────────
// Dev-only endpoint: uses TESTCODE to mark the current user as having
// "purchased" the coupon book for this Foodie Group.
// Returns { hasAccess: boolean }
// SECURITY: Hard-gated behind NODE_ENV !== 'production'
router.post('/:id/test-purchase', auth(), async (req, res, next) => {
  // Hard guard: prevent access in production
  if (process.env.NODE_ENV === 'production') {
    console.warn('📦  /test-purchase blocked in production');
    return res.status(403).json({ error: 'Test purchase endpoint not available in production' });
  }

  const groupId = req.params.id;
  const rawCode = (req.body && req.body.code) || '';
  const code = String(rawCode).trim().toUpperCase();

  console.log('📦  POST /api/v1/groups/:id/test-purchase', { groupId, code });

  try {
    const sub = req.user && req.user.sub;
    if (!sub) {
      console.warn('📦  /groups/:id/test-purchase called without Cognito sub');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 0) Validate test code
    const VALID_CODE = 'TESTCODE';
    if (code !== VALID_CODE) {
      console.warn('📦  invalid test code used for /test-purchase', { code });
      return res.status(400).json({ error: 'Invalid unlock code.' });
    }

    // 1) Look up local user row by Cognito sub
    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.cognitoSub, sub));

    if (!dbUser) {
      console.warn('📦  No local user row for sub', sub);
      return res.status(404).json({ error: 'User not found' });
    }

    // 2) Check if a purchase already exists
    const existing = await db
      .select()
      .from(purchase)
      .where(
        and(
          eq(purchase.userId, dbUser.id),
          eq(purchase.groupId, groupId),
          eq(purchase.status, 'paid')
        )
      );

    if (existing.length === 0) {
      // 3) Insert a dev/test purchase row
      await db.insert(purchase).values({
        userId: dbUser.id,
        groupId,
        provider: 'test',
        stripeCheckoutId: null,  // No Stripe ID for test purchases
        stripeSubscriptionId: null,
        amountCents: 0,
        currency: 'usd',
        status: 'paid',
        purchasedAt: new Date().toISOString(),
        expiresAt: null,
        refundedAt: null,
        metadata: { source: 'test-code', code: 'TESTCODE' },
      });

      console.log('📦  created test purchase for user/group', {
        userId: dbUser.id,
        groupId,
      });
    } else {
      console.log('📦  test purchase already exists, skipping insert', {
        userId: dbUser.id,
        groupId,
      });
    }

    // 4) Ensure membership exists as well
    await ensureFoodieGroupMembership(dbUser.id, groupId);

    // 5) Respond with hasAccess = true
    return res.json({ hasAccess: true });
  } catch (err) {
    console.error('📦  error in POST /groups/:id/test-purchase', err);
    next(err);
  }
});


// ─── GET /api/v1/groups/my/admin-memberships ─────────────────────
// Return foodie group admin memberships for the current user
router.get('/my/admin-memberships', auth(), async (req, res, next) => {
  console.log('📦  GET /api/v1/groups/my/admin-memberships');

  try {
    const sub = req.user && req.user.sub;
    if (!sub) {
      console.warn('📦  /groups/my/admin-memberships called without Cognito sub');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.cognitoSub, sub));

    if (!dbUser) {
      console.warn('📦  No local user row for sub', sub);
      return res.status(403).json({ error: 'User not registered.' });
    }

    const rows = await db
      .select({
        groupId: foodieGroupMembership.groupId,
        name: foodieGroup.name,
      })
      .from(foodieGroupMembership)
      .innerJoin(
        foodieGroup,
        eq(foodieGroup.id, foodieGroupMembership.groupId)
      )
      .where(
        and(
          eq(foodieGroupMembership.userId, dbUser.id),
          eq(foodieGroupMembership.role, 'foodie_group_admin'),
          isNull(foodieGroupMembership.deletedAt)
        )
      );

    return res.json(rows);
  } catch (err) {
    console.error('📦  error in GET /groups/my/admin-memberships', err);
    next(err);
  }
});

// ─── GET /api/v1/groups/my-purchases ─────────────────────────────
// Return all coupon-book purchases for the currently logged-in user
router.get('/my/purchases', auth(), async (req, res, next) => {
  console.log('📦  GET /api/v1/groups/my-purchases');

  try {
    const sub = req.user && req.user.sub;
    if (!sub) {
      console.warn('📦  /groups/my-purchases called without Cognito sub');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1) Look up local user row by Cognito sub
    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.cognitoSub, sub));

    if (!dbUser) {
      console.warn('📦  No local user row for sub', sub);
      return res.status(403).json({ error: 'User not registered.' });
    }

    // 2) Join purchases → foodieGroup for this user
    // Filter for paid status and non-expired purchases only
    const now = new Date().toISOString();
    const rows = await db
      .select({
        id:          purchase.id,
        groupId:     purchase.groupId,
        status:      purchase.status,
        purchasedAt: purchase.purchasedAt,
        expiresAt:   purchase.expiresAt,
        amountCents: purchase.amountCents,
        currency:    purchase.currency,
        groupName:   foodieGroup.name,
      })
      .from(purchase)
      .innerJoin(foodieGroup, eq(foodieGroup.id, purchase.groupId))
      .where(
        and(
          eq(purchase.userId, dbUser.id),
          eq(purchase.status, 'paid'),
          or(
            isNull(purchase.expiresAt),
            sql`${purchase.expiresAt} > ${now}`
          )
        )
      );

    res.json(rows);
  } catch (err) {
    console.error('📦  error in GET /groups/my-purchases', err);
    next(err);
  }
});

async function ensureFoodieGroupMembership(userId, groupId) {
  // Check if membership already exists
  const [existing] = await db
    .select()
    .from(foodieGroupMembership)
    .where(
      and(
        eq(foodieGroupMembership.userId, userId),
        eq(foodieGroupMembership.groupId, groupId)
      )
    );

  // If membership exists:
  // - Do nothing (we don't want to overwrite a group admin's role,
  //   or downgrade foodie_group_admin → customer)
  if (existing) {
    // Optional: if you ever use soft delete via deletedAt, you can “restore” it here:
    // if (existing.deletedAt) {
    //   await db.update(foodieGroupMembership)
    //     .set({ deletedAt: null, joinedAt: new Date().toISOString() })
    //     .where(eq(foodieGroupMembership.id, existing.id));
    // }
    return;
  }

  // Otherwise, insert a new membership as a normal customer
  await db.insert(foodieGroupMembership).values({
    userId,
    groupId,
    role: 'customer',          // customers become “members” by purchase
    joinedAt: new Date().toISOString(),
  });

}
export default router;
