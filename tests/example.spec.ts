/**
 * Example Playwright test demonstrating the test setup pattern
 * This test shows how to use shared fixtures and utilities
 *
 * Tests are organized into two categories:
 * 1. Fixture tests - These test the data setup/teardown and don't require a running server
 * 2. Browser tests - These require a running dev server (start with `bun run dev`)
 */

import { test, expect } from './setup/test-fixtures'
import type {
  Organization,
  User,
  Person,
  TestData,
} from './setup/test-fixtures'
import type { Page } from '@playwright/test'

/**
 * Fixture Tests
 * These tests verify the test data creation and cleanup fixtures work correctly.
 * They don't require a running dev server.
 */
test.describe('Fixture Tests', () => {
  test('should create and cleanup test data', async ({
    organization,
    user,
    person,
    testData,
  }: {
    organization: Organization
    user: User
    person: Person
    testData: TestData
  }) => {
    // Test data is automatically created via fixtures
    expect(organization).toBeDefined()
    expect(organization.clerkOrganizationId).toBeDefined()
    expect(user).toBeDefined()
    expect(person).toBeDefined()

    // Verify test data tracking
    expect(testData.organizationIds).toContain(organization.id)
    expect(testData.userIds).toContain(user.id)
    expect(testData.personIds).toContain(person.id)

    // Cleanup happens automatically after test via fixtures
  })

  test('should create organization with fixtures', async ({
    organization,
  }: {
    organization: Organization
  }) => {
    // Organization is created via fixture
    expect(organization.id).toBeDefined()
    expect(organization.clerkOrganizationId).toBeDefined()
  })

  test('should handle Clerk user creation and cleanup', async ({
    clerkUserId,
    testData,
  }: {
    clerkUserId: string | null
    testData: TestData
  }) => {
    // Clerk user is created via fixture
    expect(clerkUserId).toBeDefined()
    expect(testData.clerkUserIds).toContain(clerkUserId)

    // Clerk user will be automatically deleted after test
  })

  test('should create isolated test data per test', async ({
    organization,
    user,
    person,
    testData,
  }: {
    organization: Organization
    user: User
    person: Person
    testData: TestData
  }) => {
    // Each test gets its own isolated data
    expect(organization.id).toBeDefined()
    expect(user.id).toBeDefined()
    expect(person.id).toBeDefined()

    // Data should be tracked for cleanup
    expect(testData.organizationIds.length).toBeGreaterThan(0)
    expect(testData.userIds.length).toBeGreaterThan(0)
    expect(testData.personIds.length).toBeGreaterThan(0)

    // Clerk organization should also be tracked
    expect(testData.clerkOrganizationIds.length).toBeGreaterThan(0)
  })

  test('should have valid IDs for each test run', async ({
    organization,
    user,
    person,
  }: {
    organization: Organization
    user: User
    person: Person
  }) => {
    // IDs should be non-empty strings (Prisma uses cuid format)
    expect(organization.id).toBeDefined()
    expect(typeof organization.id).toBe('string')
    expect(organization.id.length).toBeGreaterThan(0)

    expect(user.id).toBeDefined()
    expect(typeof user.id).toBe('string')
    expect(user.id.length).toBeGreaterThan(0)

    expect(person.id).toBeDefined()
    expect(typeof person.id).toBe('string')
    expect(person.id.length).toBeGreaterThan(0)
  })
})

/**
 * Browser Tests
 * These tests require a running dev server. Start with `bun run dev` before running.
 * They will be skipped automatically if the server is not available.
 */
test.describe('Browser Tests (requires dev server)', () => {
  test('should navigate to root and handle redirect', async ({
    page,
  }: {
    page: Page
  }) => {
    // Navigate to root - this test requires a running dev server
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 })
    } catch {
      test.skip(true, 'Dev server not running - start with: bun run dev')
      return
    }

    // Wait for any initial redirects
    await page.waitForTimeout(1000)

    // Root should redirect to sign in (unauthenticated) or dashboard (authenticated)
    const url = page.url()
    expect(url).toMatch(/\/auth\/signin|\/dashboard|\/$/)
  })

  test('should display sign-in page', async ({ page }: { page: Page }) => {
    // This test requires a running dev server
    try {
      await page.goto('/auth/signin', {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      })
    } catch {
      test.skip(true, 'Dev server not running - start with: bun run dev')
      return
    }

    // Wait for Clerk to load
    await page.waitForTimeout(2000)

    // Should see the sign-in form (Clerk uses specific selectors)
    const emailInput = page.locator(
      'input[type="email"], input[name="identifier"], #identifier-field'
    )
    await expect(emailInput.first()).toBeVisible({ timeout: 10000 })
  })

  test('should display sign-up page', async ({ page }: { page: Page }) => {
    // This test requires a running dev server
    try {
      await page.goto('/auth/signup', {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      })
    } catch {
      test.skip(true, 'Dev server not running - start with: bun run dev')
      return
    }

    // Wait for Clerk to load
    await page.waitForTimeout(2000)

    // Should see the sign-up form
    const pageContent = await page.content()
    // Clerk's SignUp component should be present
    expect(pageContent).toMatch(/sign.*up|create.*account/i)
  })
})

/**
 * Authenticated Route Tests
 * These tests require a running dev server AND proper Clerk authentication setup.
 * They demonstrate how to use the authenticatedPage fixture for testing protected routes.
 */
test.describe('Authenticated Route Tests (requires dev server)', () => {
  test('should access dashboard when authenticated', async ({
    authenticatedPage,
    organization: _organization,
    user: _user,
  }: {
    authenticatedPage: Page
    organization: Organization
    user: User
  }) => {
    // Wait for authentication to complete
    await authenticatedPage
      .waitForLoadState('domcontentloaded', { timeout: 10000 })
      .catch(() => {
        // May already be loaded
      })

    // Navigate to dashboard
    try {
      await authenticatedPage.goto('/dashboard', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
    } catch {
      test.skip(true, 'Dev server not running - start with: bun run dev')
      return
    }

    // Should be on dashboard (not redirected to sign-in)
    const url = authenticatedPage.url()
    expect(url).toMatch(/\/dashboard/)
  })

  test('should access people page when authenticated', async ({
    authenticatedPage,
    organization: _organization,
    user: _user,
  }: {
    authenticatedPage: Page
    organization: Organization
    user: User
  }) => {
    // Wait for page to be ready
    await authenticatedPage
      .waitForLoadState('domcontentloaded', { timeout: 10000 })
      .catch(() => {
        // May already be loaded
      })

    // Navigate to people page
    try {
      await authenticatedPage.goto('/people', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
    } catch {
      test.skip(true, 'Dev server not running - start with: bun run dev')
      return
    }

    // Should be on people page
    const url = authenticatedPage.url()
    expect(url).toMatch(/\/people/)
  })
})

/**
 * Person Management Tests
 * These tests verify creating, viewing, and managing people.
 * They require a running dev server AND proper Clerk authentication with admin role.
 */
test.describe('Person Management (requires dev server + admin)', () => {
  test('should display new person form', async ({
    authenticatedPage,
    organization: _organization,
    user: _user,
  }: {
    authenticatedPage: Page
    organization: Organization
    user: User
  }) => {
    // Navigate to new person page
    try {
      await authenticatedPage.goto('/people/new', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
    } catch {
      test.skip(true, 'Dev server not running - start with: bun run dev')
      return
    }

    // Wait for page to load
    await authenticatedPage.waitForTimeout(1000)

    // Check if we're on the form page or redirected (non-admin users get redirected)
    const url = authenticatedPage.url()
    if (url.includes('/people/new')) {
      // Should see the person form with name input
      const nameInput = authenticatedPage.locator('input#name')
      await expect(nameInput).toBeVisible({ timeout: 10000 })

      // Should see the submit button
      const submitButton = authenticatedPage.locator(
        'button[type="submit"]:has-text("Create Person")'
      )
      await expect(submitButton).toBeVisible({ timeout: 5000 })
    } else {
      // User was redirected (likely not an admin)
      expect(url).toMatch(/\/people/)
    }
  })

  test('should create a new person with minimal data', async ({
    authenticatedPage,
    organization: _organization,
    user: _user,
  }: {
    authenticatedPage: Page
    organization: Organization
    user: User
  }) => {
    // Navigate to new person page
    try {
      await authenticatedPage.goto('/people/new', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
    } catch {
      test.skip(true, 'Dev server not running - start with: bun run dev')
      return
    }

    // Wait for page to load
    await authenticatedPage.waitForTimeout(1000)

    // Check if we have access to the form
    const url = authenticatedPage.url()
    if (!url.includes('/people/new')) {
      test.skip(true, 'User does not have admin access to create people')
      return
    }

    // Generate a unique name for this test
    const testPersonName = `Test Person ${Date.now()}`

    // Fill in the name field (required)
    const nameInput = authenticatedPage.locator('input#name')
    await expect(nameInput).toBeVisible({ timeout: 10000 })
    await nameInput.fill(testPersonName)

    // Submit the form
    const submitButton = authenticatedPage.locator(
      'button[type="submit"]:has-text("Create Person")'
    )
    await expect(submitButton).toBeEnabled({ timeout: 5000 })
    await submitButton.click()

    // Wait for navigation to the new person's page
    await authenticatedPage.waitForURL(/\/people\/[a-zA-Z0-9]+$/, {
      timeout: 15000,
    })

    // Verify we're on the person detail page
    const newUrl = authenticatedPage.url()
    expect(newUrl).toMatch(/\/people\/[a-zA-Z0-9]+$/)

    // The page should show the person's name
    await expect(
      authenticatedPage.locator(`text=${testPersonName}`)
    ).toBeVisible({ timeout: 10000 })
  })

  test('should create a new person with full data', async ({
    authenticatedPage,
    organization: _organization,
    user: _user,
  }: {
    authenticatedPage: Page
    organization: Organization
    user: User
  }) => {
    // Navigate to new person page
    try {
      await authenticatedPage.goto('/people/new', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
    } catch {
      test.skip(true, 'Dev server not running - start with: bun run dev')
      return
    }

    // Wait for page to load
    await authenticatedPage.waitForTimeout(1000)

    // Check if we have access to the form
    const url = authenticatedPage.url()
    if (!url.includes('/people/new')) {
      test.skip(true, 'User does not have admin access to create people')
      return
    }

    // Generate unique test data
    const timestamp = Date.now()
    const testPersonName = `Test Person ${timestamp}`
    const testEmail = `test-person-${timestamp}@example.com`
    const testTitle = 'Senior Engineer'

    // Fill in the name field (required)
    const nameInput = authenticatedPage.locator('input#name')
    await expect(nameInput).toBeVisible({ timeout: 10000 })
    await nameInput.fill(testPersonName)

    // Fill in the email field
    const emailInput = authenticatedPage.locator('input#email')
    await emailInput.fill(testEmail)

    // Fill in the title/role field
    const roleInput = authenticatedPage.locator('input#role')
    await roleInput.fill(testTitle)

    // Select status (should default to active, but let's verify the dropdown works)
    const statusTrigger = authenticatedPage
      .locator('button[role="combobox"]')
      .filter({ hasText: /Active|Inactive|On Leave/i })
      .first()
    if (await statusTrigger.isVisible()) {
      await statusTrigger.click()
      await authenticatedPage
        .locator('[role="option"]:has-text("Active")')
        .click()
    }

    // Submit the form
    const submitButton = authenticatedPage.locator(
      'button[type="submit"]:has-text("Create Person")'
    )
    await expect(submitButton).toBeEnabled({ timeout: 5000 })
    await submitButton.click()

    // Wait for navigation to the new person's page
    await authenticatedPage.waitForURL(/\/people\/[a-zA-Z0-9]+$/, {
      timeout: 15000,
    })

    // Verify we're on the person detail page
    const newUrl = authenticatedPage.url()
    expect(newUrl).toMatch(/\/people\/[a-zA-Z0-9]+$/)

    // The page should show the person's name
    await expect(
      authenticatedPage.locator(`text=${testPersonName}`)
    ).toBeVisible({ timeout: 10000 })
  })

  test('should show validation error for empty name', async ({
    authenticatedPage,
    organization: _organization,
    user: _user,
  }: {
    authenticatedPage: Page
    organization: Organization
    user: User
  }) => {
    // Navigate to new person page
    try {
      await authenticatedPage.goto('/people/new', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
    } catch {
      test.skip(true, 'Dev server not running - start with: bun run dev')
      return
    }

    // Wait for page to load
    await authenticatedPage.waitForTimeout(1000)

    // Check if we have access to the form
    const url = authenticatedPage.url()
    if (!url.includes('/people/new')) {
      test.skip(true, 'User does not have admin access to create people')
      return
    }

    // The submit button should be disabled when name is empty
    const submitButton = authenticatedPage.locator(
      'button[type="submit"]:has-text("Create Person")'
    )
    await expect(submitButton).toBeDisabled({ timeout: 5000 })

    // Fill in name then clear it
    const nameInput = authenticatedPage.locator('input#name')
    await nameInput.fill('Test')
    await expect(submitButton).toBeEnabled({ timeout: 2000 })

    await nameInput.clear()
    await expect(submitButton).toBeDisabled({ timeout: 2000 })
  })
})
