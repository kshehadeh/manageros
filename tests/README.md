# Playwright Test Suite

This directory contains the Playwright integration test suite for ManagerOS.

## Setup

1. Install Playwright browsers (if not already installed):

```bash
npx playwright install
```

2. Ensure environment variables are set:

- `DATABASE_URL` - Database connection string
- `CLERK_SECRET_KEY` - Clerk API secret key (for user management in tests)
- `CLERK_API_URL` - Clerk API URL (optional, defaults to <https://api.clerk.com/v1>)
- `PLAYWRIGHT_TEST_BASE_URL` - Base URL for tests (optional, defaults to <http://localhost:3000>)

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in UI mode (interactive)
npm run test:ui

# Run tests in debug mode
npm run test:debug

# Run tests in headed mode (see browser)
npm run test:headed

# View test report
npm run test:report
```

## Test Structure

### Shared Utilities

- `tests/setup/db-helpers.ts` - Database helper functions that use existing application functions
- `tests/setup/clerk-helpers.ts` - Clerk API utilities for managing test users
- `tests/setup/test-fixtures.ts` - Shared Playwright fixtures for test setup/teardown

### Test Files

- `tests/*.spec.ts` - Individual test files

## Writing Tests

### Using Fixtures

The test suite provides several fixtures that automatically handle setup and cleanup:

```typescript
import { test, expect } from './setup/test-fixtures'

test('my test', async ({ organization, user, person, testData }) => {
  // organization, user, and person are automatically created
  // testData tracks all created entities for cleanup

  // Your test code here
  expect(organization.name).toContain('Test Org')

  // Cleanup happens automatically after the test
})
```

### Available Fixtures

- `organization` - A test organization (automatically created and cleaned up)
- `user` - A test user in the organization
- `person` - A test person in the organization
- `clerkUserId` - A Clerk user ID (automatically created and deleted)
- `testData` - Tracks all created entities for cleanup
- `authenticatedPage` - A page with authentication (placeholder - needs implementation)

### Manual Database Operations

If you need to create entities manually, use the helper functions:

```typescript
import { createTestSetup, cleanupTestData } from './setup/db-helpers'

test('manual setup', async () => {
  const { organization, user, person, testData } = await createTestSetup({
    orgName: 'My Test Org',
    userEmail: 'test@example.com',
  })

  // Use the entities in your test

  // Cleanup
  await cleanupTestData(testData)
})
```

### Clerk User Management

For Clerk-authenticated users, use the Clerk helper:

```typescript
import { getClerkHelper } from './setup/clerk-helpers'

test('clerk user', async () => {
  const clerkHelper = getClerkHelper()
  const clerkUserId = await clerkHelper.createTestUser(
    'test@example.com',
    'Test User'
  )

  // Use clerkUserId in your test

  // Cleanup
  await clerkHelper.deleteTestUser(clerkUserId)
})
```

## Best Practices

1. **Use Existing Functions**: Always use existing application functions (from `src/lib/actions/`) rather than direct database access when possible. This ensures tests use the same code paths as production.

2. **Automatic Cleanup**: Use fixtures to automatically clean up test data. If you create entities manually, track them in `testData` for cleanup.

3. **Clerk Users**: Always delete Clerk users after tests to avoid leaving test users in Clerk.

4. **Isolation**: Each test should be independent and not rely on data from other tests.

5. **Shared Code**: Extract common test patterns into helper functions or fixtures to avoid duplication.

## Example Test

See `tests/example.spec.ts` for a complete example demonstrating the test setup pattern.
