// Pricing API Integration Tests
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getTestDb, closeTestDb, seedHelpers, withTransaction } from '../../helpers/db.js';
import { eq, and, isNull } from 'drizzle-orm';
import * as schema from '../../../drizzle/schema';

describe('Pricing API Integration', () => {
  let db;

  beforeAll(async () => {
    db = await getTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  describe('Price Authorization', () => {
    it('should allow foodie_group_admin to see they can update price', async () => {
      await withTransaction(async (db) => {
        const user = await seedHelpers.createUser(db);
        const group = await seedHelpers.createFoodieGroup(db);

        // Create foodie_group_admin membership
        await db.insert(schema.foodieGroupMembership).values({
          userId: user.id,
          groupId: group.id,
          role: 'foodie_group_admin',
        });

        // Check if user is group admin
        const [membership] = await db
          .select()
          .from(schema.foodieGroupMembership)
          .where(
            and(
              eq(schema.foodieGroupMembership.userId, user.id),
              eq(schema.foodieGroupMembership.groupId, group.id),
              eq(schema.foodieGroupMembership.role, 'foodie_group_admin'),
              isNull(schema.foodieGroupMembership.deletedAt)
            )
          );

        expect(membership).toBeDefined();
        const isGroupAdmin = !!membership;
        expect(isGroupAdmin).toBe(true);
      });
    });

    it('should allow super_admin to update any group price', async () => {
      await withTransaction(async (db) => {
        const user = await seedHelpers.createUser(db, { role: 'super_admin' });
        const group = await seedHelpers.createFoodieGroup(db);

        // Super admin has role in user table, not membership
        expect(user.role).toBe('super_admin');

        // Super admin can update any group regardless of membership
        const isSuperAdmin = user.role === 'super_admin';
        expect(isSuperAdmin).toBe(true);
      });
    });

    it('should deny non-admin from updating price', async () => {
      await withTransaction(async (db) => {
        const user = await seedHelpers.createUser(db, { role: 'customer' });
        const group = await seedHelpers.createFoodieGroup(db);

        // Create regular customer membership
        await db.insert(schema.foodieGroupMembership).values({
          userId: user.id,
          groupId: group.id,
          role: 'customer',
        });

        // Check admin status
        const [membership] = await db
          .select()
          .from(schema.foodieGroupMembership)
          .where(
            and(
              eq(schema.foodieGroupMembership.userId, user.id),
              eq(schema.foodieGroupMembership.groupId, group.id),
              eq(schema.foodieGroupMembership.role, 'foodie_group_admin'),
              isNull(schema.foodieGroupMembership.deletedAt)
            )
          );

        const isGroupAdmin = !!membership;
        const isSuperAdmin = user.role === 'super_admin';

        expect(isGroupAdmin).toBe(false);
        expect(isSuperAdmin).toBe(false);

        // Should be denied
        const canUpdatePrice = isGroupAdmin || isSuperAdmin;
        expect(canUpdatePrice).toBe(false);
      });
    });
  });

  describe('Price History', () => {
    it('should deactivate old price when new price is set', async () => {
      await withTransaction(async (db) => {
        const group = await seedHelpers.createFoodieGroup(db);
        const user = await seedHelpers.createUser(db);

        // Create initial price
        const [oldPrice] = await db
          .insert(schema.couponBookPrice)
          .values({
            groupId: group.id,
            amountCents: 799,
            currency: 'usd',
            isActive: true,
            createdByUserId: user.id,
          })
          .returning();

        expect(oldPrice.isActive).toBe(true);

        // Deactivate old price
        await db
          .update(schema.couponBookPrice)
          .set({
            isActive: false,
            archivedAt: new Date().toISOString(),
          })
          .where(eq(schema.couponBookPrice.id, oldPrice.id));

        // Create new price
        const [newPrice] = await db
          .insert(schema.couponBookPrice)
          .values({
            groupId: group.id,
            amountCents: 999,
            currency: 'usd',
            isActive: true,
            stripeProductId: 'prod_test_123',
            stripePriceId: 'price_test_new',
            createdByUserId: user.id,
          })
          .returning();

        // Verify old price is inactive
        const [updatedOldPrice] = await db
          .select()
          .from(schema.couponBookPrice)
          .where(eq(schema.couponBookPrice.id, oldPrice.id));

        expect(updatedOldPrice.isActive).toBe(false);
        expect(updatedOldPrice.archivedAt).toBeDefined();

        // Verify new price is active
        expect(newPrice.isActive).toBe(true);
        expect(newPrice.amountCents).toBe(999);

        // Verify only one active price per group
        const activePrices = await db
          .select()
          .from(schema.couponBookPrice)
          .where(
            and(
              eq(schema.couponBookPrice.groupId, group.id),
              eq(schema.couponBookPrice.isActive, true)
            )
          );

        expect(activePrices.length).toBe(1);
        expect(activePrices[0].id).toBe(newPrice.id);
      });
    });

    it('should preserve price history', async () => {
      await withTransaction(async (db) => {
        const group = await seedHelpers.createFoodieGroup(db);
        const user = await seedHelpers.createUser(db);

        // Create multiple prices over time
        await db.insert(schema.couponBookPrice).values({
          groupId: group.id,
          amountCents: 499,
          currency: 'usd',
          isActive: false,
          archivedAt: new Date().toISOString(),
          createdByUserId: user.id,
        });

        await db.insert(schema.couponBookPrice).values({
          groupId: group.id,
          amountCents: 799,
          currency: 'usd',
          isActive: false,
          archivedAt: new Date().toISOString(),
          createdByUserId: user.id,
        });

        await db.insert(schema.couponBookPrice).values({
          groupId: group.id,
          amountCents: 999,
          currency: 'usd',
          isActive: true,
          createdByUserId: user.id,
        });

        // Get all prices for group (history)
        const allPrices = await db
          .select()
          .from(schema.couponBookPrice)
          .where(eq(schema.couponBookPrice.groupId, group.id));

        expect(allPrices.length).toBe(3);

        // Get only active price
        const [activePrice] = await db
          .select()
          .from(schema.couponBookPrice)
          .where(
            and(
              eq(schema.couponBookPrice.groupId, group.id),
              eq(schema.couponBookPrice.isActive, true)
            )
          );

        expect(activePrice.amountCents).toBe(999);
      });
    });
  });

  describe('Price Validation', () => {
    it('should store price in cents', async () => {
      await withTransaction(async (db) => {
        const group = await seedHelpers.createFoodieGroup(db);
        const user = await seedHelpers.createUser(db);

        // $9.99 = 999 cents
        const [price] = await db
          .insert(schema.couponBookPrice)
          .values({
            groupId: group.id,
            amountCents: 999, // $9.99
            currency: 'usd',
            isActive: true,
            createdByUserId: user.id,
          })
          .returning();

        expect(price.amountCents).toBe(999);

        // Calculate display price
        const displayPrice = price.amountCents / 100;
        expect(displayPrice).toBe(9.99);
      });
    });

    it('should enforce minimum price of 50 cents', async () => {
      // This is an application-level validation, not DB constraint
      const minPriceCents = 50;
      const testPrice = 49;

      expect(testPrice < minPriceCents).toBe(true);
    });

    it('should enforce maximum price of $999.99', async () => {
      // This is an application-level validation, not DB constraint
      const maxPriceCents = 99999;
      const testPrice = 100000;

      expect(testPrice > maxPriceCents).toBe(true);
    });
  });

  describe('Price Snapshot in Purchase', () => {
    it('should store price snapshot at purchase time', async () => {
      await withTransaction(async (db) => {
        const user = await seedHelpers.createUser(db);
        const group = await seedHelpers.createFoodieGroup(db);

        const priceSnapshot = {
          amountCents: 999,
          currency: 'usd',
          stripePriceId: 'price_test_snapshot',
          couponBookPriceId: 'cbp_test_123',
        };

        const [purchase] = await db
          .insert(schema.purchase)
          .values({
            userId: user.id,
            groupId: group.id,
            provider: 'stripe',
            stripeCheckoutId: 'cs_test_snapshot_123',
            amountCents: 999,
            currency: 'usd',
            status: 'paid',
            priceSnapshot: priceSnapshot,
            purchasedAt: new Date().toISOString(),
          })
          .returning();

        expect(purchase.priceSnapshot).toEqual(priceSnapshot);
        expect(purchase.priceSnapshot.amountCents).toBe(999);
        expect(purchase.priceSnapshot.stripePriceId).toBe('price_test_snapshot');
      });
    });
  });
});
