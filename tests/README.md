# Testing Documentation

This directory contains the test suite for the VivaSpot Coupon Book application.

## Test Structure

```
tests/
├── unit/              # Unit tests for isolated components
│   ├── server/        # Backend unit tests
│   ├── frontend/      # Frontend unit tests
│   └── styles/        # CSS/design token tests
├── integration/       # Integration tests
│   ├── api/           # API endpoint tests
│   ├── db/            # Database operation tests
│   └── auth/          # Authentication flow tests
└── helpers/           # Test utilities and helpers
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Database Setup

Integration tests require a test database. Configure the following environment variables:

```bash
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_USER=test_user
TEST_DB_PASS=test_password
TEST_DB_NAME=test_db
TEST_DB_SSL=false  # Set to 'true' if SSL is required
```

If not set, tests will fall back to the main database environment variables (`DB_*`).

## Test Categories

### Unit Tests

- **Auth Middleware**: JWT verification, token extraction, error handling
- **Schema Validation**: Drizzle schema definitions, constraints, relationships
- **API Routes**: Critical endpoint logic (users, coupons, groups, submissions)
- **Frontend Services**: Auth service, API service
- **Vue Components**: Critical components (dashboards, cards, headers)
- **Design Tokens**: CSS variable consistency and validation

### Integration Tests

- **API Flows**: End-to-end request/response cycles
  - Authentication flow (signup → login → token usage)
  - Coupon redemption flow
  - Purchase flow
  - Submission approval flow

- **Database Operations**:
  - Schema constraint enforcement
  - Transaction rollback
  - Soft delete functionality

- **Authentication**:
  - JWT verification with real token structure
  - Role-based access control

## Writing New Tests

### Unit Test Example

```javascript
import { describe, it, expect, vi } from 'vitest';
import { functionToTest } from '../../path/to/module.js';

describe('Module Name', () => {
  it('should do something', () => {
    const result = functionToTest();
    expect(result).toBe(expected);
  });
});
```

### Integration Test Example

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestDb, closeTestDb, withTransaction } from '../../helpers/db.js';

describe('Feature Integration', () => {
  let db;

  beforeAll(async () => {
    db = getTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('should perform integration test', async () => {
    await withTransaction(async (db) => {
      // Test code here
    });
  });
});
```

## Test Helpers

### Database Helpers (`helpers/db.js`)
- `getTestDb()`: Get test database connection
- `closeTestDb()`: Close database connection
- `withTransaction(testFn)`: Run test in transaction (auto-rollback)
- `seedHelpers`: Factory functions for creating test data

### Mock Helpers (`helpers/mocks.js`)
- `generateMockJWT()`: Create mock Cognito JWT token
- `generateMockIdToken()`: Create mock Cognito ID token
- `createMockRequest()`: Create Express request mock
- `createMockResponse()`: Create Express response mock

### Vue Helpers (`helpers/vue.js`)
- `createMockRouter()`: Create Vue Router mock
- `createMockStore()`: Create Vuex store mock

## Notes

- Tests use a separate test database to avoid affecting production data
- AWS Cognito is mocked for unit tests
- Database transactions are used for test isolation
- Focus is on critical business logic paths








