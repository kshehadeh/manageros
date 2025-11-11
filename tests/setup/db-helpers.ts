/**
 * Database helper utilities for tests
 *
 * NOTE: These functions use direct Prisma access for test setup because:
 * 1. Existing application functions (e.g., createOrganization, createPerson) require authentication
 * 2. Tests need to set up data without authentication context
 * 3. This is similar to how seed scripts work
 *
 * For actual test scenarios (not setup), prefer using existing application functions
 * from src/lib/actions/ to ensure tests use the same code paths as production.
 */

import { prisma } from '@/lib/db'
import type { PersonFormData } from '@/lib/validations'

/**
 * Test data cleanup tracker
 * Tracks all entities created during tests for cleanup
 */
export interface TestData {
  userIds: string[]
  organizationIds: string[]
  personIds: string[]
  clerkUserIds: string[]
  otherIds: Record<string, string[]>
  clerkPasswords?: Array<{ clerkUserId: string; password: string }>
}

/**
 * Create a test organization using the existing createOrganization function
 * This ensures we test the same code path as production
 */
export async function createTestOrganization(
  name: string = `Test Org ${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  slug: string = `test-org-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
) {
  // Note: This requires a user to be authenticated
  // In tests, you'll need to create a user first or mock authentication
  // For now, we'll use direct DB access but note that production code uses createOrganization
  const organization = await prisma.organization.create({
    data: {
      name,
      slug,
    },
  })

  return organization
}

/**
 * Create a test user in the database
 * Note: This creates a user without Clerk authentication
 * For Clerk-authenticated users, use the Clerk API helpers
 */
export async function createTestUser(
  email: string,
  name: string,
  organizationId?: string,
  clerkUserId?: string
) {
  const user = await prisma.user.create({
    data: {
      email,
      name,
      organizationId: organizationId || null,
      clerkUserId: clerkUserId || null,
      role: organizationId ? 'ADMIN' : 'USER',
    },
  })

  return user
}

/**
 * Create a test person using the existing createPerson function
 * This requires an authenticated admin user
 */
export async function createTestPerson(
  formData: PersonFormData,
  organizationId: string
) {
  // Note: createPerson requires authentication and admin role
  // For tests, we'll use direct DB access but note the production path
  const person = await prisma.person.create({
    data: {
      name: formData.name,
      email: formData.email,
      role: formData.role || null,
      status: formData.status || 'active',
      organizationId,
      teamId: formData.teamId || null,
      managerId: formData.managerId || null,
      startedAt: formData.startedAt ? new Date(formData.startedAt) : null,
      birthday: formData.birthday
        ? new Date(formData.birthday + 'T00:00:00')
        : null,
    },
  })

  return person
}

/**
 * Cleanup test data from the database
 * This should be called after each test to ensure no test data leaks
 */
export async function cleanupTestData(testData: TestData) {
  // Cleanup in reverse order of dependencies

  // Clean up people first (they may reference users)
  for (const personId of testData.personIds) {
    try {
      await prisma.person.delete({
        where: { id: personId },
      })
    } catch (error) {
      // Person may have already been deleted or have dependencies
      console.warn(`Failed to delete person ${personId}:`, error)
    }
  }

  // Clean up users
  for (const userId of testData.userIds) {
    try {
      await prisma.user.delete({
        where: { id: userId },
      })
    } catch (error) {
      // User may have already been deleted or have dependencies
      console.warn(`Failed to delete user ${userId}:`, error)
    }
  }

  // Clean up organizations (this will cascade delete related data)
  for (const orgId of testData.organizationIds) {
    try {
      await prisma.organization.delete({
        where: { id: orgId },
      })
    } catch (error) {
      // Organization may have already been deleted or have dependencies
      console.warn(`Failed to delete organization ${orgId}:`, error)
    }
  }

  // Clean up any other tracked entities
  for (const [entityType, ids] of Object.entries(testData.otherIds)) {
    for (const id of ids) {
      try {
        // Use Prisma's dynamic model access
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any)[entityType].delete({
          where: { id },
        })
      } catch (error) {
        console.warn(`Failed to delete ${entityType} ${id}:`, error)
      }
    }
  }
}

/**
 * Create a complete test setup with organization, user, and person
 * Returns all created entities for cleanup
 */
export async function createTestSetup(options?: {
  orgName?: string
  orgSlug?: string
  userEmail?: string
  userName?: string
  personName?: string
  personEmail?: string
  clerkUserId?: string
}) {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 9)
  const orgName = options?.orgName || `Test Org ${timestamp}-${randomSuffix}`
  const orgSlug = options?.orgSlug || `test-org-${timestamp}-${randomSuffix}`
  const userEmail =
    options?.userEmail || `test-user-${timestamp}-${randomSuffix}@example.com`
  const userName = options?.userName || `Test User ${timestamp}-${randomSuffix}`
  const personName =
    options?.personName || `Test Person ${timestamp}-${randomSuffix}`
  const personEmail =
    options?.personEmail ||
    `test-person-${timestamp}-${randomSuffix}@example.com`

  // Create organization
  const organization = await createTestOrganization(orgName, orgSlug)

  // Create user
  const user = await createTestUser(
    userEmail,
    userName,
    organization.id,
    options?.clerkUserId
  )

  // Update user to be admin of the organization
  await prisma.user.update({
    where: { id: user.id },
    data: {
      organizationId: organization.id,
      role: 'ADMIN',
    },
  })

  // Create person
  const person = await createTestPerson(
    {
      name: personName,
      email: personEmail,
      status: 'active',
    },
    organization.id
  )

  return {
    organization,
    user,
    person,
    testData: {
      userIds: [user.id],
      organizationIds: [organization.id],
      personIds: [person.id],
      clerkUserIds: options?.clerkUserId ? [options.clerkUserId] : [],
      otherIds: {},
    },
  }
}
