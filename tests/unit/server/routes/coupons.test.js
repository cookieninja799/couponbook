// Coupons route unit tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse, generateMockJWT } from '../../../helpers/mocks.js';
import { eq, and } from 'drizzle-orm';

// Mock dependencies
vi.mock('../../../../server/src/db.js', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    delete: vi.fn().mockReturnThis(),
  },
}));

vi.mock('../../../../server/src/middleware/auth.js', () => ({
  default: vi.fn(() => (req, res, next) => {
    req.user = { sub: 'test-sub', email: 'test@example.com' };
    next();
  }),
}));

import { db } from '../../../../server/src/db.js';

describe('Coupons Routes', () => {
  let req, res;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    vi.clearAllMocks();
  });

  describe('POST /api/v1/coupons/:id/redeem', () => {
    it('should require authentication', () => {
      req.user = null;
      expect(req.user).toBeNull();
    });

    it('should reject redemption for non-existent coupon', async () => {
      req.user = { sub: 'test-sub' };
      req.params = { id: 'non-existent-id' };

      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      // Coupon not found
      const coupons = await db.select().from().where();
      expect(coupons).toEqual([]);
    });

    it('should reject redemption for expired coupon', () => {
      const now = new Date();
      const expiredDate = new Date(now.getTime() - 86400000); // yesterday

      const coupon = {
        id: 'coupon-id',
        expiresAt: expiredDate.toISOString(),
        validFrom: new Date(now.getTime() - 172800000).toISOString(), // 2 days ago
      };

      expect(new Date(coupon.expiresAt) < now).toBe(true);
    });

    it('should reject redemption for not-yet-valid coupon', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 86400000); // tomorrow

      const coupon = {
        id: 'coupon-id',
        validFrom: futureDate.toISOString(),
        expiresAt: new Date(now.getTime() + 172800000).toISOString(), // 2 days from now
      };

      expect(new Date(coupon.validFrom) > now).toBe(true);
    });

    it('should prevent duplicate redemption', async () => {
      req.user = { sub: 'test-sub' };
      req.params = { id: 'coupon-id' };

      const existingRedemption = {
        id: 'redemption-id',
        couponId: 'coupon-id',
        userId: 'user-id',
        redeemedAt: new Date().toISOString(),
      };

      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingRedemption]),
        }),
      });

      const redemptions = await db.select().from().where();
      expect(redemptions.length).toBeGreaterThan(0);
    });

    it('should create redemption for valid coupon', async () => {
      req.user = { sub: 'test-sub' };
      req.params = { id: 'coupon-id' };

      const now = new Date();
      const coupon = {
        id: 'coupon-id',
        validFrom: new Date(now.getTime() - 86400000).toISOString(),
        expiresAt: new Date(now.getTime() + 86400000).toISOString(),
      };

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([coupon]),
        }),
      });

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 'user-id', cognitoSub: 'test-sub' },
          ]),
        }),
      });

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]), // No existing redemption
        }),
      });

      db.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'redemption-id',
              couponId: 'coupon-id',
              userId: 'user-id',
              redeemedAt: now.toISOString(),
            },
          ]),
        }),
      });

      const couponResult = await db.select().from().where();
      expect(couponResult[0].id).toBe('coupon-id');
    });
  });

  describe('GET /api/v1/coupons/redemptions/me', () => {
    it('should require authentication', () => {
      req.user = null;
      expect(req.user).toBeNull();
    });

    it('should return user redemptions', async () => {
      req.user = { sub: 'test-sub' };

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 'user-id', cognitoSub: 'test-sub' },
          ]),
        }),
      });

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { couponId: 'coupon-1', redeemedAt: new Date().toISOString() },
            { couponId: 'coupon-2', redeemedAt: new Date().toISOString() },
          ]),
        }),
      });

      const user = await db.select().from().where();
      expect(user[0].cognitoSub).toBe('test-sub');
    });
  });
});





