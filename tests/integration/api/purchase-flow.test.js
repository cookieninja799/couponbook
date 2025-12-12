// Purchase flow integration tests
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestDb, closeTestDb, seedHelpers, withTransaction } from '../../helpers/db.js';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../../drizzle/schema';

describe('Purchase Flow Integration', () => {
  let db;

  beforeAll(async () => {
    db = await getTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('should create purchase and membership', async () => {
    await withTransaction(async (db) => {
      const user = await seedHelpers.createUser(db);
      const group = await seedHelpers.createFoodieGroup(db);

      // Create purchase
      const purchase = await seedHelpers.createPurchase(db, user.id, group.id, {
        status: 'paid',
      });

      expect(purchase).toBeDefined();
      expect(purchase.status).toBe('paid');
      expect(purchase.userId).toBe(user.id);
      expect(purchase.groupId).toBe(group.id);

      // Create membership
      const membership = await seedHelpers.createMembership(db, user.id, group.id);

      expect(membership).toBeDefined();
      expect(membership.userId).toBe(user.id);
      expect(membership.groupId).toBe(group.id);
      expect(membership.role).toBe('customer');
    });
  });

  it('should check access after purchase', async () => {
    await withTransaction(async (db) => {
      const user = await seedHelpers.createUser(db);
      const group = await seedHelpers.createFoodieGroup(db);

      await seedHelpers.createPurchase(db, user.id, group.id, {
        status: 'paid',
      });

      const purchases = await db
        .select()
        .from(schema.purchase)
        .where(
          and(
            eq(schema.purchase.userId, user.id),
            eq(schema.purchase.groupId, group.id),
            eq(schema.purchase.status, 'paid')
          )
        );

      expect(purchases.length).toBeGreaterThan(0);
      const hasAccess = purchases.length > 0;
      expect(hasAccess).toBe(true);
    });
  });
});


