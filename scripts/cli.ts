#!/usr/bin/env bun

/**
 * ManagerOS CLI Tool
 *
 * Usage:
 *   bun scripts/cli.ts user list                - List all users
 *   bun scripts/cli.ts user delete              - Interactive user deletion
 *   bun scripts/cli.ts user delete <email>      - Delete user by email
 *   bun scripts/cli.ts org list                 - List all organizations
 *   bun scripts/cli.ts org delete               - Interactive organization deletion
 *   bun scripts/cli.ts org delete <slug>        - Delete organization by slug
 */

import { select, confirm } from '@inquirer/prompts'
import { PrismaClient } from '@prisma/client'

// ============================================================================
// Prisma Client Setup
// ============================================================================

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
  })
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// ============================================================================
// Clerk Helper Functions
// ============================================================================

type UserPresence = 'both' | 'clerk-only' | 'database-only'

interface UserWithPresence {
  email: string
  clerkUserId?: string
  databaseUserId?: string
  name?: string
  presence: UserPresence
}

interface ClerkOrganization {
  id: string
  name: string
  slug: string
  created_at: number
  updated_at: number
  members_count: number
  admin_delete_enabled: boolean
  max_allowed_memberships: number | null
  has_image: boolean
  image_url: string
  public_metadata: Record<string, unknown>
  private_metadata: Record<string, unknown>
  object: 'organization'
}

function getClerkConfig() {
  const apiKey = process.env.CLERK_SECRET_KEY
  const baseUrl = process.env.CLERK_API_URL || 'https://api.clerk.com/v1'
  return { apiKey, baseUrl }
}

/**
 * Fetch all users from Clerk (with pagination)
 */
async function fetchAllClerkUsers(): Promise<
  Array<{
    id: string
    email_addresses: Array<{ email_address: string }>
    first_name?: string
    last_name?: string
  }>
> {
  const { apiKey, baseUrl } = getClerkConfig()

  if (!apiKey) {
    console.warn('WARNING: CLERK_SECRET_KEY not set. Cannot fetch Clerk users.')
    return []
  }

  const allUsers: Array<{
    id: string
    email_addresses: Array<{ email_address: string }>
    first_name?: string
    last_name?: string
  }> = []
  const limit = 500
  let offset = 0
  let hasMore = true

  try {
    while (hasMore) {
      const response = await fetch(
        `${baseUrl}/users?limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(
          `Failed to fetch Clerk users: ${response.status} ${error}`
        )
      }

      const data = await response.json()
      const users = Array.isArray(data) ? data : data.data || []

      allUsers.push(...users)

      // Check if there are more users to fetch
      if (Array.isArray(data)) {
        hasMore = users.length === limit
      } else {
        hasMore = data.has_more === true
      }

      offset += limit
    }

    return allUsers
  } catch (error) {
    console.error('Error fetching Clerk users:', error)
    return []
  }
}

/**
 * Compare Clerk and database users to determine presence status
 */
async function compareUsers(): Promise<UserWithPresence[]> {
  console.log('Loading users from Clerk...')
  const clerkUsers = await fetchAllClerkUsers()
  console.log(`Found ${clerkUsers.length} user(s) in Clerk`)

  console.log('Loading users from database...')
  const dbUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      clerkUserId: true,
    },
    orderBy: {
      email: 'asc',
    },
  })
  console.log(`Found ${dbUsers.length} user(s) in database\n`)

  // Create maps for quick lookup
  const clerkMap = new Map<string, (typeof clerkUsers)[0]>()
  const dbMap = new Map<string, (typeof dbUsers)[0]>()

  // Index Clerk users by ID and email
  for (const clerkUser of clerkUsers) {
    clerkMap.set(clerkUser.id, clerkUser)
    const primaryEmail =
      clerkUser.email_addresses?.[0]?.email_address?.toLowerCase()
    if (primaryEmail) {
      clerkMap.set(`email:${primaryEmail}`, clerkUser)
    }
  }

  // Index database users by ID, clerkUserId, and email
  for (const dbUser of dbUsers) {
    dbMap.set(dbUser.id, dbUser)
    if (dbUser.clerkUserId) {
      dbMap.set(`clerk:${dbUser.clerkUserId}`, dbUser)
    }
    dbMap.set(`email:${dbUser.email.toLowerCase()}`, dbUser)
  }

  const result: UserWithPresence[] = []
  const processedEmails = new Set<string>()

  // Process Clerk users
  for (const clerkUser of clerkUsers) {
    const primaryEmail =
      clerkUser.email_addresses?.[0]?.email_address?.toLowerCase()
    if (!primaryEmail || processedEmails.has(primaryEmail)) continue

    processedEmails.add(primaryEmail)
    const dbUser =
      dbMap.get(`clerk:${clerkUser.id}`) || dbMap.get(`email:${primaryEmail}`)

    result.push({
      email: primaryEmail,
      clerkUserId: clerkUser.id,
      databaseUserId: dbUser?.id,
      name:
        dbUser?.name ||
        `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim() ||
        undefined,
      presence: dbUser ? 'both' : 'clerk-only',
    })
  }

  // Process database users not found in Clerk
  for (const dbUser of dbUsers) {
    const email = dbUser.email.toLowerCase()
    if (processedEmails.has(email)) continue

    processedEmails.add(email)
    const clerkUser = dbUser.clerkUserId
      ? clerkMap.get(dbUser.clerkUserId)
      : clerkMap.get(`email:${email}`)

    result.push({
      email,
      clerkUserId: clerkUser?.id || dbUser.clerkUserId || undefined,
      databaseUserId: dbUser.id,
      name: dbUser.name || undefined,
      presence: clerkUser ? 'both' : 'database-only',
    })
  }

  // Sort by email
  result.sort((a, b) => a.email.localeCompare(b.email))

  return result
}

async function deleteClerkUser(clerkUserId: string): Promise<boolean> {
  const { apiKey, baseUrl } = getClerkConfig()

  if (!apiKey) {
    console.warn(
      'WARNING: CLERK_SECRET_KEY not set. Skipping Clerk user deletion.'
    )
    return false
  }

  try {
    const response = await fetch(`${baseUrl}/users/${clerkUserId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok && response.status !== 404) {
      const error = await response.text()
      throw new Error(
        `Failed to delete Clerk user: ${response.status} ${error}`
      )
    }

    return true
  } catch (error) {
    console.error(`Error deleting Clerk user ${clerkUserId}:`, error)
    return false
  }
}

// ============================================================================
// User Commands
// ============================================================================

async function listUsers() {
  const users = await prisma.user.findMany({
    include: {
      person: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      email: 'asc',
    },
  })

  return users
}

function formatUserForDisplay(user: Awaited<ReturnType<typeof listUsers>>[0]) {
  // Organization membership is now managed by Clerk, not stored in OrganizationMember table
  const person = user.person ? ` (Person: ${user.person.name})` : ''
  return `${user.email} - ${user.name}${person}`
}

async function listUsersCommand() {
  try {
    // Check if we're in production
    if (process.env.NODE_ENV === 'production') {
      console.error('ERROR: This script can only be run in development mode!')
      console.error(
        'Set NODE_ENV to "development" or unset it to use this script.'
      )
      process.exit(1)
    }

    // Get users with presence status
    const usersWithPresence = await compareUsers()

    if (usersWithPresence.length === 0) {
      console.log('No users found.')
      return
    }

    // Group by presence
    const both = usersWithPresence.filter(u => u.presence === 'both')
    const clerkOnly = usersWithPresence.filter(u => u.presence === 'clerk-only')
    const dbOnly = usersWithPresence.filter(u => u.presence === 'database-only')

    console.log('='.repeat(80))
    console.log('USER PRESENCE SUMMARY')
    console.log('='.repeat(80))
    console.log(`Total users: ${usersWithPresence.length}`)
    console.log(`  ✓ In both Clerk and database: ${both.length}`)
    console.log(`  ⚠ Only in Clerk: ${clerkOnly.length}`)
    console.log(`  ⚠ Only in database: ${dbOnly.length}`)
    console.log('')

    // Get full database user details for users that exist in database
    const dbUserIds = usersWithPresence
      .filter(u => u.databaseUserId)
      .map(u => u.databaseUserId!)
    const dbUsers =
      dbUserIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: dbUserIds } },
            include: {
              person: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          })
        : []

    const dbUserMap = new Map(dbUsers.map(u => [u.id, u]))

    if (both.length > 0) {
      console.log('='.repeat(80))
      console.log(`USERS IN BOTH CLERK AND DATABASE (${both.length})`)
      console.log('='.repeat(80))
      both.forEach((user, index) => {
        const dbUser = user.databaseUserId
          ? dbUserMap.get(user.databaseUserId)
          : null
        // Organization membership is now managed by Clerk
        const orgs = 'Check Clerk for membership'
        const person = dbUser?.person
          ? `${dbUser.person.name} (${dbUser.person.email})`
          : 'Not linked'

        console.log(`${index + 1}. ${user.name || user.email}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Database ID: ${user.databaseUserId}`)
        console.log(`   Clerk ID: ${user.clerkUserId}`)
        console.log(`   Organizations: ${orgs}`)
        console.log(`   Linked Person: ${person}`)
        console.log('')
      })
    }

    if (clerkOnly.length > 0) {
      console.log('='.repeat(80))
      console.log(`USERS ONLY IN CLERK (${clerkOnly.length})`)
      console.log('='.repeat(80))
      clerkOnly.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || user.email}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Clerk ID: ${user.clerkUserId}`)
        console.log('')
      })
    }

    if (dbOnly.length > 0) {
      console.log('='.repeat(80))
      console.log(`USERS ONLY IN DATABASE (${dbOnly.length})`)
      console.log('='.repeat(80))
      dbOnly.forEach((user, index) => {
        const dbUser = user.databaseUserId
          ? dbUserMap.get(user.databaseUserId)
          : null
        // Organization membership is now managed by Clerk
        const orgs = 'Check Clerk for membership'
        const person = dbUser?.person
          ? `${dbUser.person.name} (${dbUser.person.email})`
          : 'Not linked'

        console.log(`${index + 1}. ${user.name || user.email}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Database ID: ${user.databaseUserId}`)
        console.log(`   Clerk ID: ${user.clerkUserId || 'N/A'}`)
        console.log(`   Organizations: ${orgs}`)
        console.log(`   Linked Person: ${person}`)
        console.log('')
      })
    }
  } catch (error) {
    console.error('Error listing users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function deleteUserByIdentifier(identifier: string) {
  console.log(`Looking up user: ${identifier}\n`)

  // First, check presence status using compareUsers which properly matches Clerk and DB users
  const allUsers = await compareUsers()
  const matchingUser = allUsers.find(
    u =>
      u.email.toLowerCase() === identifier.toLowerCase() ||
      u.clerkUserId === identifier ||
      u.databaseUserId === identifier
  )

  if (!matchingUser) {
    throw new Error(`User not found in database or Clerk: ${identifier}`)
  }

  console.log('='.repeat(80))
  console.log('USER PRESENCE STATUS')
  console.log('='.repeat(80))
  console.log(`Email: ${matchingUser.email}`)
  console.log(`Name: ${matchingUser.name || 'N/A'}`)
  console.log(`Presence: ${matchingUser.presence}`)
  console.log(
    `  ${matchingUser.clerkUserId ? '✓' : '✗'} Clerk: ${matchingUser.clerkUserId || 'Not found'}`
  )
  console.log(
    `  ${matchingUser.databaseUserId ? '✓' : '✗'} Database: ${matchingUser.databaseUserId || 'Not found'}`
  )
  console.log('='.repeat(80))
  console.log('')

  // Use the IDs from compareUsers to fetch the actual user records
  let user = null
  if (matchingUser.databaseUserId) {
    user = await prisma.user.findUnique({
      where: { id: matchingUser.databaseUserId },
      include: {
        person: {
          select: {
            id: true,
            name: true,
          },
        },
        organizationMemberships: {
          include: {
            organization: {
              select: {
                id: true,
                clerkOrganizationId: true,
              },
            },
          },
        },
      },
    })
  }

  // Fetch Clerk user using the ID from compareUsers
  let clerkUser: {
    id: string
    email_addresses: Array<{ email_address: string }>
  } | null = null
  const { apiKey, baseUrl } = getClerkConfig()
  if (apiKey && matchingUser.clerkUserId) {
    try {
      const response = await fetch(
        `${baseUrl}/users/${matchingUser.clerkUserId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      )
      if (response.ok) {
        clerkUser = await response.json()
      } else if (response.status !== 404) {
        // Log non-404 errors but continue
        const errorText = await response.text()
        console.warn(
          `Warning: Failed to fetch Clerk user ${matchingUser.clerkUserId}: ${response.status} ${errorText}`
        )
      }
    } catch (error) {
      console.warn(
        `Warning: Error fetching Clerk user ${matchingUser.clerkUserId}:`,
        error
      )
    }
  }

  if (!user && !clerkUser) {
    throw new Error(`User not found in database or Clerk: ${identifier}`)
  }

  if (user) {
    console.log('DATABASE USER FOUND:')
    console.log(`  ID: ${user.id}`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Name: ${user.name}`)
    console.log(
      `  Clerk User ID: ${user.clerkUserId || matchingUser.clerkUserId || 'N/A'}`
    )
    // Organization membership is now managed by Clerk
    console.log(`  Organizations: Check Clerk API`)
    console.log(`  Person: ${user.person?.name || 'N/A'}`)
    console.log('')
  } else {
    console.log('No database user found (user only exists in Clerk)')
    if (clerkUser) {
      console.log(`  Clerk User ID: ${clerkUser.id}`)
      console.log(
        `  Email: ${clerkUser.email_addresses?.[0]?.email_address || 'N/A'}`
      )
    }
    console.log('')
  }

  if (clerkUser && !user) {
    console.log('CLERK USER FOUND:')
    console.log(`  ID: ${clerkUser.id}`)
    console.log(
      `  Email: ${clerkUser.email_addresses?.[0]?.email_address || 'N/A'}`
    )
    console.log('')
  }

  // Unlink person if linked
  if (user && user.personId) {
    console.log(
      `\nUnlinking user from person: ${user.person?.name} (${user.personId})`
    )
    await prisma.user.update({
      where: { id: user.id },
      data: { personId: null },
    })
    console.log('✓ Person unlinked')
  }

  // Delete Clerk user if exists
  // Use the Clerk user ID from compareUsers (most reliable) or from the fetched clerkUser
  const clerkIdToDelete = matchingUser.clerkUserId || clerkUser?.id
  if (clerkIdToDelete) {
    console.log(`\nDeleting Clerk user: ${clerkIdToDelete}`)
    const clerkDeleted = await deleteClerkUser(clerkIdToDelete)
    if (clerkDeleted) {
      console.log('✓ Clerk user deleted')
    } else {
      console.log('⚠ Clerk user deletion skipped or failed')
    }
  } else {
    console.log('\nNo Clerk user ID found, skipping Clerk deletion')
  }

  // Organization memberships are now managed by Clerk, not in OrganizationMember table

  // Delete database user if exists
  if (user) {
    // Handle relationships that don't cascade before deleting the user
    console.log(`\nHandling user relationships before deletion...`)

    // Delete tasks created by the user
    const taskCount = await prisma.task.count({
      where: { createdById: user.id },
    })
    if (taskCount > 0) {
      console.log(`  Deleting ${taskCount} task(s) created by user...`)
      await prisma.task.deleteMany({
        where: { createdById: user.id },
      })
      console.log(`  ✓ Deleted ${taskCount} task(s)`)
    }

    // Delete meetings created by the user
    const meetingCount = await prisma.meeting.count({
      where: { createdById: user.id },
    })
    if (meetingCount > 0) {
      console.log(`  Deleting ${meetingCount} meeting(s) created by user...`)
      await prisma.meeting.deleteMany({
        where: { createdById: user.id },
      })
      console.log(`  ✓ Deleted ${meetingCount} meeting(s)`)
    }

    // Delete organization invitations sent by the user
    const invitationCount = await prisma.organizationInvitation.count({
      where: { invitedById: user.id },
    })
    if (invitationCount > 0) {
      console.log(
        `  Deleting ${invitationCount} organization invitation(s) sent by user...`
      )
      await prisma.organizationInvitation.deleteMany({
        where: { invitedById: user.id },
      })
      console.log(`  ✓ Deleted ${invitationCount} invitation(s)`)
    }

    // Delete notifications for the user
    const notificationCount = await prisma.notification.count({
      where: { userId: user.id },
    })
    if (notificationCount > 0) {
      console.log(`  Deleting ${notificationCount} notification(s) for user...`)
      await prisma.notification.deleteMany({
        where: { userId: user.id },
      })
      console.log(`  ✓ Deleted ${notificationCount} notification(s)`)
    }

    console.log(`\nDeleting database user: ${user.id}`)
    await prisma.user.delete({
      where: { id: user.id },
    })
    console.log('✓ Database user deleted')
  } else {
    console.log('\nNo database user found, skipping database deletion')
  }

  console.log('\n✓ User deletion completed successfully!')
}

async function deleteUser(email?: string) {
  try {
    // Check if we're in production
    if (process.env.NODE_ENV === 'production') {
      console.error('ERROR: This script can only be run in development mode!')
      console.error(
        'Set NODE_ENV to "development" or unset it to use this script.'
      )
      process.exit(1)
    }

    let userIdentifier: string

    if (email) {
      // Direct deletion by email
      userIdentifier = email
    } else {
      // Interactive selection - show users with presence status
      console.log('Loading users from Clerk and database...')
      const usersWithPresence = await compareUsers()

      if (usersWithPresence.length === 0) {
        console.log('No users found.')
        return
      }

      // Get full database user details for formatting
      const dbUserIds = usersWithPresence
        .filter(u => u.databaseUserId)
        .map(u => u.databaseUserId!)
      const dbUsers = dbUserIds.length > 0 ? await listUsers() : []

      const dbUserMap = new Map(dbUsers.map(u => [u.email.toLowerCase(), u]))

      const choices = usersWithPresence.map(user => {
        const dbUser = dbUserMap.get(user.email.toLowerCase())
        const presenceLabel =
          user.presence === 'both'
            ? '✓ Both'
            : user.presence === 'clerk-only'
              ? '⚠ Clerk only'
              : '⚠ DB only'
        const displayName = dbUser
          ? formatUserForDisplay(dbUser)
          : `${user.email} - ${user.name || 'N/A'}`
        return {
          name: `${presenceLabel} | ${displayName}`,
          value: user.email,
        }
      })

      userIdentifier = await select({
        message: 'Select a user to delete:',
        choices,
      })
    }

    // Confirm deletion
    const confirmed = await confirm({
      message: `Are you sure you want to delete user "${userIdentifier}"? This action cannot be undone.`,
      default: false,
    })

    if (!confirmed) {
      console.log('Deletion cancelled.')
      return
    }

    await deleteUserByIdentifier(userIdentifier)
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// ============================================================================
// Organization Commands
// ============================================================================

/**
 * Fetch organization details from Clerk API
 */
async function getClerkOrganization(
  clerkOrgId: string
): Promise<ClerkOrganization | null> {
  const { apiKey, baseUrl } = getClerkConfig()
  if (!apiKey) {
    return null
  }

  try {
    const response = await fetch(`${baseUrl}/organizations/${clerkOrgId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const errorText = await response.text()
      console.warn(
        `Failed to fetch Clerk organization ${clerkOrgId}: ${response.status} ${errorText}`
      )
      return null
    }

    return (await response.json()) as ClerkOrganization
  } catch (error) {
    console.warn(`Error fetching Clerk organization ${clerkOrgId}:`, error)
    return null
  }
}

async function listOrganizations() {
  const organizations = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          members: true,
          people: true,
          teams: true,
          initiatives: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Fetch Clerk organization details for each org
  const organizationsWithClerkData = await Promise.all(
    organizations.map(async org => {
      const clerkOrg = org.clerkOrganizationId
        ? await getClerkOrganization(org.clerkOrganizationId)
        : null

      return {
        ...org,
        clerkName: clerkOrg?.name || null,
        clerkSlug: clerkOrg?.slug || null,
      }
    })
  )

  return organizationsWithClerkData
}

async function listOrganizationsCommand() {
  try {
    // Check if we're in production
    if (process.env.NODE_ENV === 'production') {
      console.error('ERROR: This script can only be run in development mode!')
      console.error(
        'Set NODE_ENV to "development" or unset it to use this script.'
      )
      process.exit(1)
    }

    console.log('Loading organizations...\n')
    const organizations = await listOrganizations()

    if (organizations.length === 0) {
      console.log('No organizations found in the database.')
      return
    }

    console.log(`Found ${organizations.length} organization(s):\n`)

    // Display organizations in a formatted table
    organizations.forEach((org, index) => {
      const displayName = org.clerkName || org.clerkOrganizationId || 'Unknown'
      const displaySlug = org.clerkSlug ? ` (${org.clerkSlug})` : ''

      console.log(`${index + 1}. ${displayName}${displaySlug}`)
      if (org.clerkName) {
        console.log(`   Name: ${org.clerkName}`)
      }
      if (org.clerkSlug) {
        console.log(`   Slug: ${org.clerkSlug}`)
      }
      console.log(`   Clerk Org ID: ${org.clerkOrganizationId}`)
      console.log(`   ID: ${org.id}`)
      console.log(`   Description: ${org.description || 'N/A'}`)
      console.log(`   Members: ${org._count.members}`)
      console.log(`   People: ${org._count.people}`)
      console.log(`   Teams: ${org._count.teams}`)
      console.log(`   Initiatives: ${org._count.initiatives}`)
      console.log(`   Created: ${org.createdAt.toLocaleDateString()}`)
      console.log('')
    })
  } catch (error) {
    console.error('Error listing organizations:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function getOrganizationStats(organizationId: string) {
  const [
    userCount,
    teamCount,
    personCount,
    initiativeCount,
    meetingCount,
    invitationCount,
    jobRoleCount,
    jobLevelCount,
    jobDomainCount,
    notificationCount,
    reportInstanceCount,
    cronJobCount,
    noteCount,
    fileAttachmentCount,
    githubOrgCount,
  ] = await Promise.all([
    0, // Member count is now managed by Clerk API
    prisma.team.count({ where: { organizationId } }),
    prisma.person.count({ where: { organizationId } }),
    prisma.initiative.count({ where: { organizationId } }),
    prisma.meeting.count({ where: { organizationId } }),
    prisma.organizationInvitation.count({ where: { organizationId } }),
    prisma.jobRole.count({ where: { organizationId } }),
    prisma.jobLevel.count({ where: { organizationId } }),
    prisma.jobDomain.count({ where: { organizationId } }),
    prisma.notification.count({ where: { organizationId } }),
    prisma.reportInstance.count({ where: { organizationId } }),
    prisma.cronJobExecution.count({ where: { organizationId } }),
    prisma.note.count({ where: { organizationId } }),
    prisma.fileAttachment.count({ where: { organizationId } }),
    prisma.organizationGithubOrg.count({ where: { organizationId } }),
  ])

  return {
    userCount,
    teamCount,
    personCount,
    initiativeCount,
    meetingCount,
    invitationCount,
    jobRoleCount,
    jobLevelCount,
    jobDomainCount,
    notificationCount,
    reportInstanceCount,
    cronJobCount,
    noteCount,
    fileAttachmentCount,
    githubOrgCount,
  }
}

async function deleteOrganization(slug?: string) {
  try {
    // Check if we're in production
    if (process.env.NODE_ENV === 'production') {
      console.error('ERROR: This script can only be run in development mode!')
      console.error(
        'Set NODE_ENV to "development" or unset it to use this script.'
      )
      process.exit(1)
    }

    let organizationSlug: string

    if (slug) {
      // Direct deletion by slug
      organizationSlug = slug
    } else {
      // Interactive selection
      console.log('Loading organizations...')
      const organizations = await listOrganizations()

      if (organizations.length === 0) {
        console.log('No organizations found in the database.')
        return
      }

      const choices = organizations.map(org => {
        const displayName =
          org.clerkName || org.clerkOrganizationId || 'Unknown'
        const displaySlug = org.clerkSlug ? ` (${org.clerkSlug})` : ''
        return {
          name: `${displayName}${displaySlug} - ${org._count.members} members, ${org._count.people} people`,
          value: org.id,
        }
      })

      organizationSlug = await select({
        message: 'Select an organization to delete:',
        choices,
      })
    }

    console.log(`Looking up organization: ${organizationSlug}`)

    // Try to find organization by clerkOrganizationId or ID
    const organization = await prisma.organization.findFirst({
      where: {
        OR: [
          { clerkOrganizationId: organizationSlug },
          { id: organizationSlug },
        ],
      },
    })

    if (!organization) {
      throw new Error(`Organization not found: ${organizationSlug}`)
    }

    // Fetch Clerk organization details
    const clerkOrg = organization.clerkOrganizationId
      ? await getClerkOrganization(organization.clerkOrganizationId)
      : null

    console.log(`\nFound organization:`)
    if (clerkOrg) {
      console.log(`  Name: ${clerkOrg.name}`)
      console.log(`  Slug: ${clerkOrg.slug}`)
    }
    console.log(`  ID: ${organization.id}`)
    console.log(`  Clerk Org ID: ${organization.clerkOrganizationId}`)
    console.log(`  Description: ${organization.description || 'N/A'}`)

    // Get statistics
    console.log(`\nGathering organization statistics...`)
    const stats = await getOrganizationStats(organization.id)

    console.log(`\nOrganization contains:`)
    console.log(`  Users: ${stats.userCount}`)
    console.log(`  Teams: ${stats.teamCount}`)
    console.log(`  People: ${stats.personCount}`)
    console.log(`  Initiatives: ${stats.initiativeCount}`)
    console.log(`  Meetings: ${stats.meetingCount}`)
    console.log(`  Invitations: ${stats.invitationCount}`)
    console.log(`  Job Roles: ${stats.jobRoleCount}`)
    console.log(`  Job Levels: ${stats.jobLevelCount}`)
    console.log(`  Job Domains: ${stats.jobDomainCount}`)
    console.log(`  Notifications: ${stats.notificationCount}`)
    console.log(`  Report Instances: ${stats.reportInstanceCount}`)
    console.log(`  Cron Job Executions: ${stats.cronJobCount}`)
    console.log(`  Notes: ${stats.noteCount}`)
    console.log(`  File Attachments: ${stats.fileAttachmentCount}`)
    console.log(`  GitHub Orgs: ${stats.githubOrgCount}`)

    // Confirm deletion
    const confirmed = await confirm({
      message: `Are you sure you want to delete organization "${clerkOrg?.name || organization.clerkOrganizationId}" (${organization.id})? This will delete ALL associated data and cannot be undone.`,
      default: false,
    })

    if (!confirmed) {
      console.log('Deletion cancelled.')
      return
    }

    // Delete organization invitations first (before users since invitations reference users)
    const invitationCount = await prisma.organizationInvitation.deleteMany({
      where: { organizationId: organization.id },
    })
    if (invitationCount.count > 0) {
      console.log(`\nDeleted ${invitationCount.count} invitation(s)`)
    }

    // Delete users and their Clerk accounts
    if (stats.userCount > 0) {
      console.log(`\nDeleting ${stats.userCount} user(s)...`)
      // Get users - since OrganizationMember table is no longer used,
      // we need to get users via Clerk API or find another way
      // For this script, we'll skip user deletion as it requires Clerk API integration
      // In production, use Clerk API to get organization members first
      console.log(
        '  ⚠ Skipping user deletion - use Clerk API to get organization members'
      )
      const users: Array<{
        id: string
        email: string
        clerkUserId: string | null
        personId: string | null
      }> = []

      for (const user of users) {
        // Unlink person if linked
        if (user.personId) {
          await prisma.user.update({
            where: { id: user.id },
            data: { personId: null },
          })
        }

        // Delete Clerk user if exists
        if (user.clerkUserId) {
          const clerkDeleted = await deleteClerkUser(user.clerkUserId)
          if (!clerkDeleted) {
            console.warn(`  ⚠ Failed to delete Clerk user for ${user.email}`)
          }
        }

        // Delete database user
        await prisma.user.delete({
          where: { id: user.id },
        })
        console.log(`  ✓ Deleted user: ${user.email}`)
      }
    }

    // Delete in dependency order (following seed script pattern)
    console.log(`\nDeleting organization data in dependency order...`)

    // Meeting instance participants
    const meetingInstanceParticipantCount =
      await prisma.meetingInstanceParticipant.deleteMany({
        where: { meetingInstance: { organizationId: organization.id } },
      })
    if (meetingInstanceParticipantCount.count > 0) {
      console.log(
        `  ✓ Deleted ${meetingInstanceParticipantCount.count} meeting instance participant(s)`
      )
    }

    // Meeting instances
    const meetingInstanceCount = await prisma.meetingInstance.deleteMany({
      where: { organizationId: organization.id },
    })
    if (meetingInstanceCount.count > 0) {
      console.log(
        `  ✓ Deleted ${meetingInstanceCount.count} meeting instance(s)`
      )
    }

    // Meeting participants
    const meetingParticipantCount = await prisma.meetingParticipant.deleteMany({
      where: { meeting: { organizationId: organization.id } },
    })
    if (meetingParticipantCount.count > 0) {
      console.log(
        `  ✓ Deleted ${meetingParticipantCount.count} meeting participant(s)`
      )
    }

    // Meetings
    const meetingCount = await prisma.meeting.deleteMany({
      where: { organizationId: organization.id },
    })
    if (meetingCount.count > 0) {
      console.log(`  ✓ Deleted ${meetingCount.count} meeting(s)`)
    }

    // Feedback
    const feedbackCount = await prisma.feedback.deleteMany({
      where: { about: { organizationId: organization.id } },
    })
    if (feedbackCount.count > 0) {
      console.log(`  ✓ Deleted ${feedbackCount.count} feedback record(s)`)
    }

    // One-on-ones
    const oneOnOneCount = await prisma.oneOnOne.deleteMany({
      where: { manager: { organizationId: organization.id } },
    })
    if (oneOnOneCount.count > 0) {
      console.log(`  ✓ Deleted ${oneOnOneCount.count} one-on-one(s)`)
    }

    // Tasks (through initiatives or objectives)
    const taskCount = await prisma.task.deleteMany({
      where: {
        OR: [
          { initiative: { organizationId: organization.id } },
          { objective: { initiative: { organizationId: organization.id } } },
        ],
      },
    })
    if (taskCount.count > 0) {
      console.log(`  ✓ Deleted ${taskCount.count} task(s)`)
    }

    // Check-ins
    const checkInCount = await prisma.checkIn.deleteMany({
      where: { initiative: { organizationId: organization.id } },
    })
    if (checkInCount.count > 0) {
      console.log(`  ✓ Deleted ${checkInCount.count} check-in(s)`)
    }

    // Objectives
    const objectiveCount = await prisma.objective.deleteMany({
      where: { initiative: { organizationId: organization.id } },
    })
    if (objectiveCount.count > 0) {
      console.log(`  ✓ Deleted ${objectiveCount.count} objective(s)`)
    }

    // Initiative owners
    const initiativeOwnerCount = await prisma.initiativeOwner.deleteMany({
      where: { initiative: { organizationId: organization.id } },
    })
    if (initiativeOwnerCount.count > 0) {
      console.log(
        `  ✓ Deleted ${initiativeOwnerCount.count} initiative owner(s)`
      )
    }

    // Initiatives
    const initiativeCount = await prisma.initiative.deleteMany({
      where: { organizationId: organization.id },
    })
    if (initiativeCount.count > 0) {
      console.log(`  ✓ Deleted ${initiativeCount.count} initiative(s)`)
    }

    // People
    const personCount = await prisma.person.deleteMany({
      where: { organizationId: organization.id },
    })
    if (personCount.count > 0) {
      console.log(`  ✓ Deleted ${personCount.count} person(s)`)
    }

    // Teams
    const teamCount = await prisma.team.deleteMany({
      where: { organizationId: organization.id },
    })
    if (teamCount.count > 0) {
      console.log(`  ✓ Deleted ${teamCount.count} team(s)`)
    }

    // Job roles
    const jobRoleCount = await prisma.jobRole.deleteMany({
      where: { organizationId: organization.id },
    })
    if (jobRoleCount.count > 0) {
      console.log(`  ✓ Deleted ${jobRoleCount.count} job role(s)`)
    }

    // Job levels
    const jobLevelCount = await prisma.jobLevel.deleteMany({
      where: { organizationId: organization.id },
    })
    if (jobLevelCount.count > 0) {
      console.log(`  ✓ Deleted ${jobLevelCount.count} job level(s)`)
    }

    // Job domains
    const jobDomainCount = await prisma.jobDomain.deleteMany({
      where: { organizationId: organization.id },
    })
    if (jobDomainCount.count > 0) {
      console.log(`  ✓ Deleted ${jobDomainCount.count} job domain(s)`)
    }

    // Entity links
    const entityLinkCount = await prisma.entityLink.deleteMany({
      where: { organizationId: organization.id },
    })
    if (entityLinkCount.count > 0) {
      console.log(`  ✓ Deleted ${entityLinkCount.count} entity link(s)`)
    }

    // Notifications
    const notificationCount = await prisma.notification.deleteMany({
      where: { organizationId: organization.id },
    })
    if (notificationCount.count > 0) {
      console.log(`  ✓ Deleted ${notificationCount.count} notification(s)`)
    }

    // Report instances
    const reportInstanceCount = await prisma.reportInstance.deleteMany({
      where: { organizationId: organization.id },
    })
    if (reportInstanceCount.count > 0) {
      console.log(`  ✓ Deleted ${reportInstanceCount.count} report instance(s)`)
    }

    // Cron job executions
    const cronJobCount = await prisma.cronJobExecution.deleteMany({
      where: { organizationId: organization.id },
    })
    if (cronJobCount.count > 0) {
      console.log(`  ✓ Deleted ${cronJobCount.count} cron job execution(s)`)
    }

    // Notes
    const noteCount = await prisma.note.deleteMany({
      where: { organizationId: organization.id },
    })
    if (noteCount.count > 0) {
      console.log(`  ✓ Deleted ${noteCount.count} note(s)`)
    }

    // File attachments
    const fileAttachmentCount = await prisma.fileAttachment.deleteMany({
      where: { organizationId: organization.id },
    })
    if (fileAttachmentCount.count > 0) {
      console.log(`  ✓ Deleted ${fileAttachmentCount.count} file attachment(s)`)
    }

    // GitHub orgs
    const githubOrgCount = await prisma.organizationGithubOrg.deleteMany({
      where: { organizationId: organization.id },
    })
    if (githubOrgCount.count > 0) {
      console.log(`  ✓ Deleted ${githubOrgCount.count} GitHub org link(s)`)
    }

    // Fetch Clerk organization details for final message
    const finalClerkOrg = organization.clerkOrganizationId
      ? await getClerkOrganization(organization.clerkOrganizationId)
      : null

    // Finally, delete the organization
    console.log(
      `\nDeleting organization: ${finalClerkOrg?.name || organization.clerkOrganizationId} (${organization.id})`
    )
    await prisma.organization.delete({
      where: { id: organization.id },
    })
    console.log('✓ Organization deleted')

    console.log('\n✓ Organization deletion completed successfully!')
  } catch (error) {
    console.error('Error deleting organization:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// ============================================================================
// Main CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: bun scripts/cli.ts <command> [options]')
    console.error('\nCommands:')
    console.error('  user list              List all users')
    console.error(
      '  user delete [email]    Delete a user (interactive if email not provided)'
    )
    console.error('  org list               List all organizations')
    console.error(
      '  org delete [slug]      Delete an organization (interactive if slug not provided)'
    )
    process.exit(1)
  }

  const [entity, action, ...rest] = args

  try {
    if (entity === 'user' && action === 'list') {
      await listUsersCommand()
    } else if (entity === 'user' && action === 'delete') {
      const email = rest[0]
      await deleteUser(email)
    } else if (entity === 'org' && action === 'list') {
      await listOrganizationsCommand()
    } else if (entity === 'org' && action === 'delete') {
      const slug = rest[0]
      await deleteOrganization(slug)
    } else {
      console.error(`Unknown command: ${entity} ${action}`)
      console.error('\nAvailable commands:')
      console.error('  user list              List all users')
      console.error('  user delete [email]    Delete a user')
      console.error('  org list               List all organizations')
      console.error('  org delete [slug]      Delete an organization')
      process.exit(1)
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
