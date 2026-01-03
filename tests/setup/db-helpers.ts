/* eslint-disable camelcase */
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
 *
 * IMPORTANT: This file uses direct Clerk API calls instead of @/lib/clerk to avoid
 * importing @clerk/nextjs/server which doesn't work in Playwright's Node environment.
 */

import { PrismaClient } from '@/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { config } from 'dotenv'
import type { PersonFormData } from '@/lib/validations'

// Load environment variables from .env file
config()

// Lazy-initialized Prisma client for tests
let prismaInstance: PrismaClient | null = null

function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    prismaInstance = new PrismaClient({ adapter })
  }
  return prismaInstance
}

// Clerk API constants
const CLERK_API_BASE = 'https://api.clerk.com/v1'

/**
 * Create a Clerk organization directly via API
 */
async function createClerkOrganizationDirect(
  name: string,
  slug: string
): Promise<{ id: string; name: string; slug: string }> {
  const apiKey = process.env.CLERK_SECRET_KEY
  if (!apiKey) {
    throw new Error('CLERK_SECRET_KEY environment variable is required')
  }

  const response = await fetch(`${CLERK_API_BASE}/organizations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      slug,
      public_metadata: {
        testOrganization: true,
        createdAt: new Date().toISOString(),
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(
      `Failed to create Clerk organization: ${response.status} ${error}`
    )
  }

  return await response.json()
}

/**
 * Delete a Clerk organization directly via API
 */
async function deleteClerkOrganizationDirect(
  clerkOrgId: string
): Promise<void> {
  const apiKey = process.env.CLERK_SECRET_KEY
  if (!apiKey) {
    throw new Error('CLERK_SECRET_KEY environment variable is required')
  }

  const response = await fetch(
    `${CLERK_API_BASE}/organizations/${clerkOrgId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  )

  if (!response.ok && response.status !== 404) {
    const error = await response.text()
    throw new Error(
      `Failed to delete Clerk organization: ${response.status} ${error}`
    )
  }
}

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
  // Passwords for Clerk users created during tests (used for authentication)
  clerkPasswords: Array<{ clerkUserId: string; password: string }>
}

/**
 * Create a test organization by creating it in Clerk first, then referencing it in the database
 * This matches the production flow where organizations are created in Clerk and referenced in our DB
 */
async function createTestOrganization(
  name: string = `Test Org ${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  slug: string = `test-org-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
) {
  // Create organization in Clerk first (name and slug are stored in Clerk)
  let clerkOrgId: string
  try {
    const clerkOrg = await createClerkOrganizationDirect(name, slug)
    clerkOrgId = clerkOrg.id
  } catch (error) {
    console.error('Failed to create Clerk organization in test:', error)
    throw new Error(
      `Failed to create Clerk organization for test: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  // Create organization in database with reference to Clerk organization
  // Note: name and slug are not stored in our database - they're in Clerk
  const organization = await getPrisma().organization.create({
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
  const user = await getPrisma().user.create({
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
  const person = await getPrisma().person.create({
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

  const prisma = getPrisma()

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
      await deleteClerkOrganizationDirect(clerkOrgId)
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
      clerkPasswords: [],
    },
  }
}
