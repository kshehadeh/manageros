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
import {
  createClerkOrganization,
  deleteClerkOrganization,
} from '@/lib/clerk-organization-utils'

/**
 * Test data cleanup tracker
 * Tracks all entities created during tests for cleanup
 */
export interface TestData {
  userIds: string[]
  organizationIds: string[]
  clerkOrganizationIds: string[] // Track Clerk organization IDs for cleanup
  personIds: string[]
  clerkUserIds: string[]
  otherIds: Record<string, string[]>
  clerkPasswords?: Array<{ clerkUserId: string; password: string }>
}

/**
 * Create a test organization by creating it in Clerk first, then referencing it in the database
 * This matches the production flow where organizations are created in Clerk and referenced in our DB
 */
export async function createTestOrganization(
  name: string = `Test Org ${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  slug: string = `test-org-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
) {
  // Create organization in Clerk first (name and slug are stored in Clerk)
  let clerkOrgId: string
  try {
    const clerkOrg = await createClerkOrganization(name, slug)
    clerkOrgId = clerkOrg.id
  } catch (error) {
    console.error('Failed to create Clerk organization in test:', error)
    throw new Error(
      `Failed to create Clerk organization for test: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  // Create organization in database with reference to Clerk organization
  // Note: name and slug are not stored in our database - they're in Clerk
  const organization = await prisma.organization.create({
    data: {
      clerkOrganizationId: clerkOrgId,
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
      clerkUserId: clerkUserId || null,
    },
  })

  // OrganizationMember records are no longer created - membership is managed by Clerk
  // If organizationId is provided, user should be added to Clerk organization via API
  // Note: In tests, you may need to mock Clerk API calls or add users via Clerk API
  // This is skipped here as it requires Clerk API integration

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
  // Delete Clerk organizations first, then database organizations
  for (const clerkOrgId of testData.clerkOrganizationIds) {
    try {
      await deleteClerkOrganization(clerkOrgId)
    } catch (error) {
      // Clerk organization may have already been deleted or not exist
      console.warn(`Failed to delete Clerk organization ${clerkOrgId}:`, error)
    }
  }

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

  // Note: User organization membership and roles are now managed by Clerk
  // If you need the user to be a member of the organization in tests, you should:
  // 1. Create the user in Clerk first (with clerkUserId)
  // 2. Add them to the Clerk organization using addUserToClerkOrganization
  // 3. Set their role in Clerk using updateUserRoleInClerkOrganization
  // This is skipped here as it requires Clerk API integration and proper test setup

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
      clerkOrganizationIds: organization.clerkOrganizationId
        ? [organization.clerkOrganizationId]
        : [],
      personIds: [person.id],
      clerkUserIds: options?.clerkUserId ? [options.clerkUserId] : [],
      otherIds: {},
    },
  }
}
