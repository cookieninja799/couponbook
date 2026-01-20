// Mock utilities for testing
import { vi } from 'vitest';
import jwt from 'jsonwebtoken';

/**
 * Generate a mock Cognito JWT token for testing
 */
export function generateMockJWT(payload = {}) {
  const defaultPayload = {
    sub: 'test-user-sub-123',
    email: 'test@example.com',
    'cognito:username': 'test@example.com',
    token_use: 'access',
    iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_TEST',
    aud: 'test-client-id',
    client_id: 'test-client-id',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000),
    ...payload,
  };

  // Use a test secret key (in real tests, this would match the JWKS)
  const secret = 'test-secret-key';
  return jwt.sign(defaultPayload, secret, { algorithm: 'HS256' });
}

/**
 * Generate a mock Cognito ID token
 */
export function generateMockIdToken(payload = {}) {
  const defaultPayload = {
    sub: 'test-user-sub-123',
    email: 'test@example.com',
    name: 'Test User',
    'cognito:username': 'test@example.com',
    token_use: 'id',
    iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_TEST',
    aud: 'test-client-id',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    ...payload,
  };

  const secret = 'test-secret-key';
  return jwt.sign(defaultPayload, secret, { algorithm: 'HS256' });
}

/**
 * Create a mock Express request object
 */
export function createMockRequest(overrides = {}) {
  return {
    headers: {
      authorization: overrides.authorization || null,
      'content-type': 'application/json',
      ...overrides.headers,
    },
    body: overrides.body || {},
    params: overrides.params || {},
    query: overrides.query || {},
    user: overrides.user || null,
    ...overrides,
  };
}

/**
 * Create a mock Express response object
 */
export function createMockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
    locals: {},
  };
  return res;
}

/**
 * Create a mock Express next function
 */
export function createMockNext() {
  return vi.fn();
}

/**
 * Mock AWS Cognito client
 */
export function createMockCognitoClient() {
  return {
    send: vi.fn(),
  };
}

export function mockStoreWithRole(role) {
  return {
    state: {
      auth: { isAuthenticated: true },
      user: { role },
    },
    getters: {
      isAuthenticated: true,
      currentUser: { role },
    },
  };
}

export function mockAuthenticatedStore() {
  return mockStoreWithRole('customer');
}

export function createMockRouter() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    currentRoute: { value: { path: '/', params: {} } },
  };
}

