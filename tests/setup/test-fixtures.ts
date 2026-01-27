/**
 * Shared test fixtures and utilities
 * Provides reusable test setup and teardown functionality
 */

/* eslint-disable react-hooks/rules-of-hooks */
// The 'use' function here is Playwright's fixture function, not a React hook

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Playwright types may not be available at compile time
import { test as base, expect } from '@playwright/test'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Playwright types may not be available at compile time
import type { Page } from '@playwright/test'
import {
  createTestSetup,
  cleanupTestData,
  createTestUser,
  createTestPerson,
  type TestData,
} from './db-helpers'
import { getClerkHelper } from './clerk-helpers'
import type { Organization, User, Person } from '@/generated/prisma'

// Export types for use in test files
export type { TestData, Organization, User, Person }

/**
 * Extended test context with custom fixtures
 */
type TestFixtures = {
  testData: TestData
  organization: Organization
  user: User
  person: Person
  clerkUserId: string | null
  authenticatedPage: Page
}

/**
 * Base test with fixtures
 * Automatically sets up and tears down test data
 */
export const test = base.extend<TestFixtures>({
  // Setup test data before each test
  // Playwright requires object destructuring pattern even when no fixtures are used
  // eslint-disable-next-line
  testData: async ({}, use: (testData: TestData) => Promise<void>) => {
    const testData: TestData = {
      userIds: [],
      organizationIds: [],
      clerkOrganizationIds: [],
      personIds: [],
      clerkUserIds: [],
      otherIds: {},
      clerkPasswords: [],
    }

    await use(testData)

    // Cleanup after test
    await cleanupTestData(testData)
  },

  // Create a test organization
  organization: async (
    { testData }: { testData: TestData },
    use: (org: Organization) => Promise<void>
  ) => {
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 9)
    const { organization, testData: setupData } = await createTestSetup({
      orgName: `Test Org ${timestamp}-${randomSuffix}`,
      orgSlug: `test-org-${timestamp}-${randomSuffix}`,
    })

    // Merge setup data into test data
    testData.userIds.push(...setupData.userIds)
    testData.organizationIds.push(...setupData.organizationIds)
    testData.clerkOrganizationIds.push(...setupData.clerkOrganizationIds)
    testData.personIds.push(...setupData.personIds)
    testData.clerkUserIds.push(...setupData.clerkUserIds)

    await use(organization)

    // Cleanup is handled by testData fixture
  },

  // Create a test user
  user: async (
    {
      organization,
      testData,
    }: { organization: Organization; testData: TestData },
    use: (user: User) => Promise<void>
  ) => {
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 9)
    // Create user in the existing organization (don't create a new org)
    const user = await createTestUser(
      `test-user-${timestamp}-${randomSuffix}@example.com`,
      `Test User ${timestamp}-${randomSuffix}`,
      organization.id
    )

    testData.userIds.push(user.id)

    await use(user)
  },

  // Create a test person
  person: async (
    {
      organization,
      testData,
    }: { organization: Organization; testData: TestData },
    use: (person: Person) => Promise<void>
  ) => {
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 9)
    // Create person in the existing organization
    const person = await createTestPerson(
      {
        name: `Test Person ${timestamp}-${randomSuffix}`,
        email: `test-person-${timestamp}-${randomSuffix}@example.com`,
        status: 'active',
      },
      organization.id
    )

    testData.personIds.push(person.id)

    await use(person)
  },

  // Create a Clerk user for authentication
  clerkUserId: async (
    { testData }: { testData: TestData },
    use: (clerkUserId: string | null) => Promise<void>
  ) => {
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 9)
    const clerkHelper = getClerkHelper()
    let clerkUserId: string | null = null

    try {
      const result = await clerkHelper.createTestUser(
        `test-clerk-${timestamp}-${randomSuffix}@example.com`,
        `Test Clerk User ${timestamp}`
      )
      clerkUserId = result.id
      testData.clerkUserIds.push(clerkUserId)

      // Store password in testData for use in authentication
      testData.clerkPasswords.push({
        clerkUserId,
        password: result.password,
      })

      await use(clerkUserId)
    } finally {
      // Cleanup Clerk user
      if (clerkUserId) {
        try {
          await clerkHelper.deleteTestUser(clerkUserId)
        } catch (error) {
          console.warn(`Failed to cleanup Clerk user ${clerkUserId}:`, error)
        }
      }
    }
  },

  // Create an authenticated page
  authenticatedPage: async (
    {
      page,
      clerkUserId,
      user,
      organization: _organization,
      testData,
    }: {
      page: Page
      clerkUserId: string | null
      user: User
      organization: Organization
      testData: TestData
    },
    use: (page: Page) => Promise<void>
  ) => {
    if (!clerkUserId) {
      throw new Error('clerkUserId is required for authenticatedPage fixture')
    }

    // Link the Clerk user to the database user if not already linked
    // Use direct Prisma import to avoid Next.js server-side dependencies
    const { PrismaClient } = await import('@/generated/prisma')
    const { PrismaPg } = await import('@prisma/adapter-pg')
    const { Pool } = await import('pg')

    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
      })

      if (!existingUser?.clerkUserId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { clerkUserId },
        })
      }

      // Sync user data to Clerk using the API directly (avoid server-side imports)
      const clerkHelper = getClerkHelper()
      const dbUserWithPerson = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          person: {
            select: {
              id: true,
            },
          },
        },
      })

      // Get organization membership separately
      const membership = await prisma.organizationMember.findFirst({
        where: { userId: user.id },
        include: {
          organization: {
            select: {
              id: true,
              clerkOrganizationId: true,
            },
          },
        },
      })

      // Get organization name and slug from Clerk if we have a membership
      let organizationName: string | null = null
      let organizationSlug: string | null = null
      if (membership?.organization?.clerkOrganizationId) {
        try {
          const clerkOrg = await clerkHelper.getClerkOrganization(
            membership.organization.clerkOrganizationId
          )
          organizationName = clerkOrg?.name || null
          organizationSlug = clerkOrg?.slug || null
        } catch (error) {
          // If we can't get Clerk org, just continue with null values
          console.warn('Could not fetch Clerk organization:', error)
        }
      }

      if (dbUserWithPerson) {
        // Update Clerk user metadata directly via API
        await clerkHelper.updateUserMetadata(clerkUserId, {
          managerOSUserId: dbUserWithPerson.id,
          organizationId: membership?.organizationId || null,
          organizationName,
          organizationSlug,
          personId: dbUserWithPerson.person?.id || null,
          role: membership?.role || 'USER',
        })
      }
    } finally {
      await prisma.$disconnect()
    }

    // Get the Clerk user to get the email for sign-in
    const clerkHelperForEmail = getClerkHelper()
    const clerkUser = await clerkHelperForEmail.getUserById(clerkUserId)

    if (!clerkUser) {
      throw new Error(`Clerk user ${clerkUserId} not found`)
    }

    const email = clerkUser.email_addresses?.[0]?.email_address || user.email

    // Get password from testData if stored
    const passwordEntry = testData.clerkPasswords?.find(
      p => p.clerkUserId === clerkUserId
    )
    const password = passwordEntry?.password

    // Navigate to sign-in page
    await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' })

    // Wait for the sign-in form to be visible (Clerk's SignIn component)
    // Clerk uses iframes, so we need to wait for the form to be ready
    await page.waitForTimeout(2000) // Give Clerk time to load

    // Try to find and fill the email input
    // Clerk's SignIn component might be in an iframe or use specific selectors
    const emailSelectors = [
      'input[type="email"]',
      'input[name="identifier"]',
      'input[autocomplete="username"]',
      '#identifier-field',
    ]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let emailInput: any = null
    for (const selector of emailSelectors) {
      try {
        const input = page.locator(selector).first()
        if (await input.isVisible({ timeout: 2000 })) {
          emailInput = input
          await input.fill(email)
          break
        }
      } catch {
        // Try next selector
      }
    }

    if (!emailInput) {
      // Try typing into any visible input (fallback)
      const inputs = page.locator(
        'input[type="email"], input[name="identifier"]'
      )
      if ((await inputs.count()) > 0) {
        emailInput = inputs.first()
        await emailInput.fill(email)
      } else {
        throw new Error('Could not find email input field on sign-in page')
      }
    }

    // Wait a moment for the form to update
    await page.waitForTimeout(500)

    // Find the submit button that's associated with the email form
    // Exclude OAuth buttons (they typically have different text or are in different containers)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let submitButton: any = null

    // Strategy: Find all submit buttons and filter out OAuth ones
    // OAuth buttons typically have text like "Continue with Google" or similar
    const allSubmitButtons = page.locator('button[type="submit"]')
    const buttonCount = await allSubmitButtons.count()

    for (let i = 0; i < buttonCount; i++) {
      const button = allSubmitButtons.nth(i)

      try {
        if (!(await button.isVisible({ timeout: 500 }).catch(() => false))) {
          continue
        }

        const buttonText = (await button.textContent()) || ''
        const buttonLabel = buttonText.toLowerCase().trim()

        // Skip OAuth buttons - they typically contain these keywords
        const isOAuth =
          /continue with|sign in with|google|github|microsoft|oauth|social sign|apple/i.test(
            buttonLabel
          )

        if (isOAuth) {
          continue
        }

        // Check parent/ancestor for OAuth indicators
        try {
          const parent = button.locator('..')
          const parentText = (await parent.textContent().catch(() => '')) || ''
          if (
            /continue with|sign in with|google|github|microsoft|oauth|social/i.test(
              parentText.toLowerCase()
            )
          ) {
            continue
          }
        } catch {
          // Ignore errors checking parent
        }

        // This looks like the email form submit button
        submitButton = button
        await button.click()
        break
      } catch {
        // Continue to next button
        continue
      }
    }

    // If we didn't find a suitable button, try pressing Enter on the email input
    // This is often the most reliable way to submit a form
    if (!submitButton) {
      await emailInput.press('Enter')
    }

    // Wait a bit for the form to process
    await page.waitForTimeout(2000)

    // If password field appears, fill it and submit
    if (password) {
      try {
        const passwordInput = page.locator('input[type="password"]').first()
        if (await passwordInput.isVisible({ timeout: 5000 })) {
          await passwordInput.fill(password)

          // Wait a moment for the form to update
          await page.waitForTimeout(500)

          // Find and click the submit button for the password form
          // Use the same strategy as before - filter out OAuth buttons
          const allPasswordSubmitButtons = page.locator('button[type="submit"]')
          const passwordButtonCount = await allPasswordSubmitButtons.count()

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let passwordSubmitButton: any = null

          for (let i = 0; i < passwordButtonCount; i++) {
            const button = allPasswordSubmitButtons.nth(i)

            try {
              if (
                !(await button.isVisible({ timeout: 500 }).catch(() => false))
              ) {
                continue
              }

              const buttonText = (await button.textContent()) || ''
              const buttonLabel = buttonText.toLowerCase().trim()

              // Skip OAuth buttons
              const isOAuth =
                /continue with|sign in with|google|github|microsoft|oauth|social sign|apple/i.test(
                  buttonLabel
                )

              if (isOAuth) {
                continue
              }

              // Check parent for OAuth indicators
              try {
                const parent = button.locator('..')
                const parentText =
                  (await parent.textContent().catch(() => '')) || ''
                if (
                  /continue with|sign in with|google|github|microsoft|oauth|social/i.test(
                    parentText.toLowerCase()
                  )
                ) {
                  continue
                }
              } catch {
                // Ignore errors checking parent
              }

              // This looks like the password form submit button
              passwordSubmitButton = button
              await button.click()
              break
            } catch {
              // Continue to next button
              continue
            }
          }

          // If no button found, try pressing Enter on the password input
          if (!passwordSubmitButton) {
            await passwordInput.press('Enter')
          }
        }
      } catch {
        // No password field - might be using magic link or already authenticated
      }
    }

    // Wait for navigation after sign-in (should redirect to dashboard or home)
    // Use waitForLoadState to ensure the page is fully loaded after authentication
    try {
      await page.waitForURL(/\/dashboard|\/people|\/tasks|\/initiatives|\/$/, {
        timeout: 15000,
      })
      // Wait for the page to be fully loaded after redirect
      await page
        .waitForLoadState('domcontentloaded', { timeout: 5000 })
        .catch(() => {
          // Ignore timeout - page might already be loaded
        })
    } catch {
      // If redirect doesn't happen, check if we're still on sign-in
      const currentUrl = page.url()
      if (currentUrl.includes('/auth/signin')) {
        console.warn(
          'Still on sign-in page - authentication may have failed or requires manual intervention'
        )
      }
    }

    await use(page)
  },
})

export { expect }
