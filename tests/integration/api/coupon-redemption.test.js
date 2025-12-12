// Coupon redemption integration tests
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestDb, closeTestDb, seedHelpers, withTransaction } from '../../helpers/db.js';
import { eq } from 'drizzle-orm';
import * as schema from '../../../drizzle/schema';

describe('Coupon Redemption Integration', () => {
  let db;

  beforeAll(async () => {
    db = await getTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('should create redemption for valid coupon', async () => {
    await withTransaction(async (db) => {
      const user = await seedHelpers.createUser(db);
      const group = await seedHelpers.createFoodieGroup(db);
      const merchant = await seedHelpers.createMerchant(db, user.id);
      const coupon = await seedHelpers.createCoupon(db, group.id, merchant.id, {
        locked: false,
      });

      const redemption = await db
        .insert(schema.couponRedemption)
        .values({
          couponId: coupon.id,
          userId: user.id,
          redeemedAt: new Date().toISOString(),
        })
        .returning();

      expect(redemption[0]).toBeDefined();
      expect(redemption[0].couponId).toBe(coupon.id);
      expect(redemption[0].userId).toBe(user.id);
    });
  });

  it('should prevent duplicate redemption', async () => {
    await withTransaction(async (db) => {
      const user = await seedHelpers.createUser(db);
      const group = await seedHelpers.createFoodieGroup(db);
      const merchant = await seedHelpers.createMerchant(db, user.id);
      const coupon = await seedHelpers.createCoupon(db, group.id, merchant.id);

      // First redemption
      await db.insert(schema.couponRedemption).values({
        couponId: coupon.id,
        userId: user.id,
        redeemedAt: new Date().toISOString(),
      });

      // Attempt duplicate - should fail due to unique constraint
      let errorThrown = false;
      try {
        await db.insert(schema.couponRedemption).values({
          couponId: coupon.id,
          userId: user.id,
          redeemedAt: new Date().toISOString(),
        });
      } catch (error) {
        errorThrown = true;
        // Error was thrown, constraint is enforced
      }
      expect(errorThrown).toBe(true);
    });
  });
});


