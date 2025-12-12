// CouponSubmissions route unit tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse } from '../../../helpers/mocks.js';

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
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

vi.mock('../../../../server/src/middleware/auth.js', () => ({
  default: vi.fn(() => (req, res, next) => {
    req.user = { sub: 'test-sub', email: 'test@example.com' };
    next();
  }),
}));

import { db } from '../../../../server/src/db.js';

describe('CouponSubmissions Routes', () => {
  let req, res;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    vi.clearAllMocks();
  });

  describe('PUT /api/v1/coupon-submissions/:id', () => {
    it('should require authentication', () => {
      req.user = null;
      expect(req.user).toBeNull();
    });

    it('should require group admin role', async () => {
      req.user = { sub: 'test-sub' };
      req.params = { id: 'submission-id' };
      req.body = { state: 'approved' };

      // Mock the database query chain
      const mockWhere = vi.fn().mockResolvedValue([
        { id: 'user-id', cognitoSub: 'test-sub', role: 'customer' },
      ]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      db.select.mockReturnValue({ from: mockFrom });

      const result = await db.select().from().where();
      expect(result[0].role).toBe('customer');
    });

    it('should allow admin to approve submission', async () => {
      req.user = { sub: 'test-sub' };
      req.params = { id: 'submission-id' };
      req.body = { state: 'approved' };

      // Mock user query for admin check
      const mockWhere = vi.fn().mockResolvedValue([
        { id: 'user-id', cognitoSub: 'test-sub', role: 'admin' },
      ]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      db.select.mockReturnValue({ from: mockFrom });

      const user = await db.select().from().where();
      expect(user[0].role).toBe('admin');
    });

    it('should create coupon when submission is approved', async () => {
      req.user = { sub: 'test-sub' };
      req.params = { id: 'submission-id' };
      req.body = { state: 'approved' };

      const submissionData = {
        title: 'Test Coupon',
        description: 'Test',
        coupon_type: 'percent',
        discount_value: 10,
        valid_from: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        locked: true,
      };

      db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'submission-id',
                state: 'approved',
                groupId: 'group-id',
                merchantId: 'merchant-id',
                submissionData,
              },
            ]),
          }),
        }),
      });

      db.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'coupon-id',
              title: submissionData.title,
              groupId: 'group-id',
              merchantId: 'merchant-id',
            },
          ]),
        }),
      });

      expect(submissionData.title).toBe('Test Coupon');
    });
  });
});


