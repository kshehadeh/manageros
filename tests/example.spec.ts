/**
 * Example Playwright test demonstrating the test setup pattern
 * This test shows how to use shared fixtures and utilities
 */

import { test, expect } from './setup/test-fixtures'
import type {
  Organization,
  User,
  Person,
  TestData,
} from './setup/test-fixtures'

test.describe('Example Test Suite', () => {
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
    expect(organization.name).toContain('Test Org')
    expect(user).toBeDefined()
    expect(person).toBeDefined()

    // Verify test data tracking
    expect(testData.organizationIds).toContain(organization.id)
    expect(testData.userIds).toContain(user.id)
    expect(testData.personIds).toContain(person.id)

    // Cleanup happens automatically after test via fixtures
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  test('should navigate to dashboard', async ({ page }: { page: any }) => {
    // Wait for navigation to complete
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Wait a bit for any redirects to happen
    await page.waitForTimeout(1000)

    // Check if we're redirected to sign in or see dashboard, or stay on root
    const url = page.url()
    // The root path might redirect or stay, so we check for any of these cases
    expect(url).toMatch(/\/auth\/signin|\/dashboard|\/$/)
  })

  test('should create organization with fixtures', async ({
    organization,
    page: _page,
  }: {
    organization: Organization
    page: any // eslint-disable-line @typescript-eslint/no-explicit-any
  }) => {
    // Organization is created via fixture
    expect(organization.id).toBeDefined()
    expect(organization.slug).toBeDefined()

    // You can use the organization in your test
    // For example, navigate to organization-specific pages
    // await _page.goto(`/organization/${organization.slug}`)
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
})

test.describe('People Management', () => {
  test('should display people list', async ({
    authenticatedPage,
    organization: _organization,
    user: _user,
  }: {
    authenticatedPage: any // eslint-disable-line @typescript-eslint/no-explicit-any
    organization: Organization
    user: User
  }) => {
    // Use authenticatedPage fixture which signs in with the test user
    // Wait for any post-authentication redirects to complete first
    await authenticatedPage
      .waitForLoadState('domcontentloaded', { timeout: 5000 })
      .catch(() => {
        // Ignore if already loaded
      })

    // Navigate to people page, handling potential redirects
    // Use waitForURL to handle cases where navigation might be interrupted by redirects
    const navigationPromise = authenticatedPage
      .goto('/people', {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      })
      .catch(async (error: Error) => {
        // If navigation is interrupted, wait for the final URL
        if (
          error.message.includes('interrupted') ||
          error.message.includes('Navigation')
        ) {
          // Wait for the page to settle on either /people or /dashboard
          await authenticatedPage.waitForURL(/\/people|\/dashboard/, {
            timeout: 5000,
          })
          const finalUrl = authenticatedPage.url()
          // If we ended up on dashboard, navigate to people
          if (finalUrl.includes('/dashboard')) {
            await authenticatedPage.goto('/people', {
              waitUntil: 'domcontentloaded',
              timeout: 10000,
            })
          }
        } else {
          throw error
        }
      })

    await navigationPromise

    // Wait for the page to load
    await authenticatedPage
      .waitForLoadState('domcontentloaded', { timeout: 5000 })
      .catch(() => {
        // Ignore timeout
      })

    const url = authenticatedPage.url()
    // Should be on people page (not redirected to sign-in)
    expect(url).toMatch(/\/people/)

    // Add assertions here
    // The page should show people content since we're authenticated
    // await expect(authenticatedPage.locator('text=People')).toBeVisible()
  })
})
