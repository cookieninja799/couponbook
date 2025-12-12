// Auth middleware unit tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import auth from '../../../../server/src/middleware/auth.js';
import { createMockRequest, createMockResponse, createMockNext } from '../../../helpers/mocks.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';

// Mock axios
vi.mock('axios');

// Mock jwk-to-pem
vi.mock('jwk-to-pem', () => ({
  default: vi.fn((jwk) => `pem-${jwk.kid}`),
}));

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token extraction', () => {
    it('should reject request without authorization header', async () => {
      req.headers.authorization = null;
      const middleware = auth();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with empty authorization header', async () => {
      req.headers.authorization = '';
      const middleware = auth();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should extract token from Bearer authorization header', async () => {
      const mockToken = 'valid-token-123';
      req.headers.authorization = `Bearer ${mockToken}`;

      // Mock JWKS response
      axios.get.mockResolvedValue({
        data: {
          keys: [
            {
              kid: 'test-kid',
              kty: 'RSA',
              use: 'sig',
              alg: 'RS256',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        },
      });

      // Mock jwt.decode to return a valid header
      vi.spyOn(jwt, 'decode').mockReturnValue({
        header: { kid: 'test-kid' },
        payload: { sub: 'test-sub' },
      });

      // Mock jwt.verify to succeed
      vi.spyOn(jwt, 'verify').mockImplementation((token, pem, options, callback) => {
        callback(null, { sub: 'test-sub', email: 'test@example.com' });
      });

      // Mock environment variables
      process.env.COGNITO_USER_POOL_ID = 'us-east-1_TEST';
      process.env.AWS_REGION = 'us-east-1';

      const middleware = auth();
      await middleware(req, res, next);

      // Should call next() on success
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
    });
  });

  describe('Token validation', () => {
    it('should reject malformed token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      vi.spyOn(jwt, 'decode').mockReturnValue(null);

      const middleware = auth();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('malformed') })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject token with unknown kid', async () => {
      req.headers.authorization = 'Bearer valid-token';

      vi.spyOn(jwt, 'decode').mockReturnValue({
        header: { kid: 'unknown-kid' },
        payload: {},
      });

      axios.get.mockResolvedValue({
        data: { keys: [] },
      });

      process.env.COGNITO_USER_POOL_ID = 'us-east-1_TEST';
      process.env.AWS_REGION = 'us-east-1';

      const middleware = auth();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token signature', async () => {
      req.headers.authorization = 'Bearer invalid-signature-token';

      vi.spyOn(jwt, 'decode').mockReturnValue({
        header: { kid: 'test-kid' },
        payload: {},
      });

      axios.get.mockResolvedValue({
        data: {
          keys: [
            {
              kid: 'test-kid',
              kty: 'RSA',
              use: 'sig',
              alg: 'RS256',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        },
      });

      vi.spyOn(jwt, 'verify').mockImplementation((token, pem, options, callback) => {
        callback(new Error('Invalid signature'), null);
      });

      process.env.COGNITO_USER_POOL_ID = 'us-east-1_TEST';
      process.env.AWS_REGION = 'us-east-1';

      const middleware = auth();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Invalid signature') })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('JWKS caching', () => {
    it('should cache JWKS after first fetch', async () => {
      // Reset modules to clear any cached state
      vi.resetModules();
      
      req.headers.authorization = 'Bearer token-1';

      axios.get.mockResolvedValue({
        data: {
          keys: [
            {
              kid: 'test-kid',
              kty: 'RSA',
              use: 'sig',
              alg: 'RS256',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        },
      });

      vi.spyOn(jwt, 'decode').mockReturnValue({
        header: { kid: 'test-kid' },
        payload: {},
      });

      vi.spyOn(jwt, 'verify').mockImplementation((token, pem, options, callback) => {
        callback(null, { sub: 'test-sub' });
      });

      process.env.COGNITO_USER_POOL_ID = 'us-east-1_TEST';
      process.env.AWS_REGION = 'us-east-1';

      // Re-import auth middleware to get fresh instance
      const authModule = await import('../../../../server/src/middleware/auth.js');
      const middleware = authModule.default();

      // First call
      await middleware(req, res, next);
      expect(axios.get).toHaveBeenCalledTimes(1);

      // Reset mocks for second call (but keep the cache in the module)
      vi.clearAllMocks();
      res = createMockResponse();
      next = createMockNext();
      req = createMockRequest({ authorization: 'Bearer token-2' });

      // Second call should use cache (no axios.get call)
      await middleware(req, res, next);
      expect(axios.get).toHaveBeenCalledTimes(0); // Should not fetch again
    });
  });
});


