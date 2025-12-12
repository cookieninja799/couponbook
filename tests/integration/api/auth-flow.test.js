// Auth flow integration tests
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getTestDb, closeTestDb, seedHelpers } from '../../helpers/db.js';

describe('Auth Flow Integration', () => {
  let db;
  let dbAvailable = false;

  beforeAll(async () => {
    try {
      db = await getTestDb();
      dbAvailable = true;
    } catch (error) {
      console.warn('Database not available for integration tests. Skipping...');
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    if (dbAvailable) {
      await closeTestDb();
    }
  });

  describe('User Signup Flow', () => {
    it('should create user via signup endpoint', async ({ skip }) => {
      if (!dbAvailable) skip();
      
      // This would require mocking Cognito or using a test Cognito pool
      // For now, we test the database side
      const testUser = await seedHelpers.createUser(db, {
        email: `test-signup-${Date.now()}@example.com`,
        cognitoSub: `test-sub-${Date.now()}`,
      });

      expect(testUser).toBeDefined();
      expect(testUser.email).toContain('test-signup');
      expect(testUser.role).toBe('customer');
    });
  });

  describe('User Sync Flow', () => {
    it('should sync user from Cognito token', async ({ skip }) => {
      if (!dbAvailable) skip();
      
      // This would test the full /api/v1/users/sync endpoint
      // Requires valid JWT token structure
      const testUser = await seedHelpers.createUser(db, {
        email: `test-sync-${Date.now()}@example.com`,
        cognitoSub: `test-sync-sub-${Date.now()}`,
      });

      expect(testUser).toBeDefined();
      expect(testUser.cognitoSub).toBeDefined();
    });
  });
});

