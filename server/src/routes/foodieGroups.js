// server/src/routes/foodieGroup.js
import express from 'express';
import { db } from '../db.js';
import { foodieGroup, purchase, user, foodieGroupMembership } from '../schema.js';
import { eq, and, count, isNull } from 'drizzle-orm';
import auth from '../middleware/auth.js';

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
router.get('/:id', async (req, res, next) => {
  try {
    const groupId = req.params.id;

    const [groupRow] = await db
      .select()
      .from(foodieGroup)
      .where(eq(foodieGroup.id, groupId));

      if (!groupRow) {
        return res.status(404).json({ error: 'Foodie group not found' });
      }
  
      // ⬇ ADD THIS BLOCK
      const [membershipAgg] = await db
        .select({
          memberCount: count(),
        })
        .from(foodieGroupMembership)
        .where(
          and(
            eq(foodieGroupMembership.groupId, groupId),
            isNull(foodieGroupMembership.deletedAt),
            // OPTIONAL: if you only want customer-type members for the count:
            // eq(foodieGroupMembership.role, 'customer'),
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

// ─── POST /api/v1/groups ──────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  console.log('📦  POST /api/v1/groups', req.body);
  try {
    const { name, description } = req.body;

    const [newGroup] = await db
      .insert(foodieGroup)
      .values({
        name,           // incoming snake_case = field name
        description
      })
      .returning();

    res.status(201).json(newGroup);
  } catch (err) {
    console.error('📦  error in POST /groups', err);
    next(err);
  }
});

// ─── PUT /api/v1/groups/:id ───────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  console.log('📦  PUT /api/v1/groups/' + req.params.id, req.body);
  try {
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
router.delete('/:id', async (req, res, next) => {
  console.log('📦  DELETE /api/v1/groups/' + req.params.id);
  try {
    const result = await db
      .delete(foodieGroup)
      .where(eq(foodieGroup.id, req.params.id));

    if (!result.count) {
      console.log('📦  group not found for delete');
      return res.status(404).json({ message: 'Group not found' });
    }
    console.log('📦  deleted group count:', result.count);
    res.json({ message: 'Group deleted' });
  } catch (err) {
    console.error('📦  error in DELETE /groups/:id', err);
    next(err);
  }
});

// GET /api/v1/groups/:id/access
// Returns { hasAccess: boolean } based on DB-backed purchases
router.get('/:id/access', auth(), async (req, res, next) => {
  const groupId = req.params.id;
  console.log('📦  GET /api/v1/groups/:id/access', { groupId });

  try {
    const sub = req.user && req.user.sub;
    if (!sub) {
      console.warn('📦  /groups/:id/access called without Cognito sub');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1) Look up local user row by Cognito sub
    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.cognitoSub, sub));

    if (!dbUser) {
      console.warn('📦  No local user row for sub', sub);
      return res.json({ hasAccess: false });
    }

    // 2) Check for a paid purchase for this group
    const purchases = await db
      .select()
      .from(purchase)
      .where(
        and(
          eq(purchase.userId, dbUser.id),
          eq(purchase.groupId, groupId),
          eq(purchase.status, 'paid')
          // you may have additional filters: not refunded, not expired, etc.
        )
      );

    const hasAccess = purchases.length > 0;

    // 3) If they have access, ensure membership row exists
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
router.post('/:id/test-purchase', auth(), async (req, res, next) => {
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
        stripeCheckoutId: `test-${groupId}-${dbUser.id}`,
        stripeSubscriptionId: null,
        amountCents: 0,
        currency: 'usd',
        status: 'paid',
        purchasedAt: new Date().toISOString(),
        expiresAt: null,
        refundedAt: null,
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
      .where(eq(purchase.userId, dbUser.id));

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
  // - Do nothing (we don't want to overwrite an admin's role,
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
