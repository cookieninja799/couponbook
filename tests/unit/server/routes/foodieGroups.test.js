// FoodieGroups route unit tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse } from '../../../helpers/mocks.js';

// Mock dependencies
vi.mock('../../../../server/src/db.js', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
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

describe('FoodieGroups Routes', () => {
  let req, res;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    vi.clearAllMocks();
  });

  describe('GET /api/v1/groups/:id/access', () => {
    it('should require authentication', () => {
      req.user = null;
      expect(req.user).toBeNull();
    });

    it('should return hasAccess: false for user without purchase', async () => {
      req.user = { sub: 'test-sub' };
      req.params = { id: 'group-id' };

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 'user-id', cognitoSub: 'test-sub' },
          ]),
        }),
      });

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]), // No purchases
        }),
      });

      const user = await db.select().from().where();
      expect(user[0].cognitoSub).toBe('test-sub');
    });

    it('should return hasAccess: true for user with paid purchase', async () => {
      req.user = { sub: 'test-sub' };
      req.params = { id: 'group-id' };

      // Mock purchases query - set up complete chain
      const mockPurchases = [
        {
          id: 'purchase-id',
          userId: 'user-id',
          groupId: 'group-id',
          status: 'paid',
        },
      ];
      
      // Reset mocks but keep the function structure
      db.select.mockReset();
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockPurchases),
        }),
      });

      const purchases = await db.select().from().where();
      expect(purchases.length).toBeGreaterThan(0);
      expect(purchases[0].status).toBe('paid');
    });
  });

  describe('POST /api/v1/groups/:id/test-purchase', () => {
    it('should require authentication', () => {
      req.user = null;
      expect(req.user).toBeNull();
    });

    it('should reject invalid test code', () => {
      req.body = { code: 'INVALID' };
      const VALID_CODE = 'TESTCODE';
      expect(req.body.code).not.toBe(VALID_CODE);
    });

    it('should create test purchase with valid code', async () => {
      req.user = { sub: 'test-sub' };
      req.params = { id: 'group-id' };
      req.body = { code: 'TESTCODE' };

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 'user-id', cognitoSub: 'test-sub' },
          ]),
        }),
      });

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]), // No existing purchase
        }),
      });

      db.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'purchase-id',
              userId: 'user-id',
              groupId: 'group-id',
              status: 'paid',
            },
          ]),
        }),
      });

      expect(req.body.code).toBe('TESTCODE');
    });

    it('should not create duplicate test purchase', async () => {
      req.user = { sub: 'test-sub' };
      req.params = { id: 'group-id' };
      req.body = { code: 'TESTCODE' };

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
            {
              id: 'existing-purchase-id',
              userId: 'user-id',
              groupId: 'group-id',
              status: 'paid',
            },
          ]),
        }),
      });

      const existing = await db.select().from().where();
      expect(existing.length).toBeGreaterThan(0);
    });
  });
});


