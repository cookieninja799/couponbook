// JWT verification integration tests
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateMockJWT, generateMockIdToken } from '../../helpers/mocks.js';
import jwt from 'jsonwebtoken';

describe('JWT Verification Integration', () => {
  it('should decode JWT token structure', () => {
    const token = generateMockJWT({
      sub: 'test-user-sub',
      email: 'test@example.com',
    });

    const decoded = jwt.decode(token, { complete: true });
    expect(decoded).toBeDefined();
    expect(decoded.payload).toBeDefined();
    expect(decoded.payload.sub).toBe('test-user-sub');
    expect(decoded.payload.email).toBe('test@example.com');
  });

  it('should decode ID token structure', () => {
    const token = generateMockIdToken({
      sub: 'test-user-sub',
      email: 'test@example.com',
      name: 'Test User',
    });

    const decoded = jwt.decode(token, { complete: true });
    expect(decoded).toBeDefined();
    expect(decoded.payload.sub).toBe('test-user-sub');
    expect(decoded.payload.email).toBe('test@example.com');
    expect(decoded.payload.name).toBe('Test User');
  });

  it('should extract token from Bearer header format', () => {
    const token = generateMockJWT();
    const authHeader = `Bearer ${token}`;
    const extracted = authHeader.replace(/^Bearer /i, '');

    expect(extracted).toBe(token);
  });

  it('should handle token expiration', () => {
    const expiredToken = generateMockJWT({
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    });

    const decoded = jwt.decode(expiredToken);
    const now = Math.floor(Date.now() / 1000);
    expect(decoded.exp).toBeLessThan(now);
  });
});














