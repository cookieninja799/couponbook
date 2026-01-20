// Submission approval integration tests
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestDb, closeTestDb, seedHelpers, withTransaction } from '../../helpers/db.js';
import { eq } from 'drizzle-orm';
import * as schema from '../../../drizzle/schema';

describe('Submission Approval Integration', () => {
  let db;

  beforeAll(async () => {
    db = await getTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('should create coupon when submission is approved', async () => {
    await withTransaction(async (db) => {
      const user = await seedHelpers.createUser(db, { role: 'super_admin' });
      const group = await seedHelpers.createFoodieGroup(db);
      const merchant = await seedHelpers.createMerchant(db, user.id);

      // Create submission
      const submission = await db
        .insert(schema.couponSubmission)
        .values({
          groupId: group.id,
          merchantId: merchant.id,
          state: 'pending',
          submissionData: {
            title: 'Test Coupon',
            description: 'Test',
            coupon_type: 'percent',
            discount_value: 10,
            valid_from: new Date().toISOString(),
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            locked: true,
          },
        })
        .returning();

      expect(submission[0]).toBeDefined();
      expect(submission[0].state).toBe('pending');

      // Approve submission
      const [updated] = await db
        .update(schema.couponSubmission)
        .set({ state: 'approved' })
        .where(eq(schema.couponSubmission.id, submission[0].id))
        .returning();

      expect(updated.state).toBe('approved');

      // Create coupon from approved submission
      const coupon = await seedHelpers.createCoupon(db, group.id, merchant.id, {
        title: updated.submissionData.title,
        couponType: updated.submissionData.coupon_type,
        discountValue: updated.submissionData.discount_value,
      });

      expect(coupon).toBeDefined();
      expect(coupon.title).toBe('Test Coupon');
      expect(coupon.groupId).toBe(group.id);
      expect(coupon.merchantId).toBe(merchant.id);
    });
  });
});


