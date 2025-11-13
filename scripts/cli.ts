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

async function deleteClerkUser(clerkUserId: string): Promise<boolean> {
  const apiKey = process.env.CLERK_SECRET_KEY
  const baseUrl = process.env.CLERK_API_URL || 'https://api.clerk.com/v1'

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
      organizationMemberships: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
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
  const orgs = user.organizationMemberships
    .map(m => m.organization.name)
    .join(', ')
  const person = user.person ? ` (Person: ${user.person.name})` : ''
  return `${user.email} - ${user.name}${person} [${orgs || 'No orgs'}]`
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

    console.log('Loading users...\n')
    const users = await listUsers()

    if (users.length === 0) {
      console.log('No users found in the database.')
      return
    }

    console.log(`Found ${users.length} user(s):\n`)

    // Display users in a formatted table
    users.forEach((user, index) => {
      const orgs = user.organizationMemberships
        .map(m => `${m.organization.name} (${m.role})`)
        .join(', ')
      const person = user.person
        ? `${user.person.name} (${user.person.email})`
        : 'Not linked'
      const clerkId = user.clerkUserId || 'N/A'

      console.log(`${index + 1}. ${user.name}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Clerk User ID: ${clerkId}`)
      console.log(`   Organizations: ${orgs || 'None'}`)
      console.log(`   Linked Person: ${person}`)
      console.log('')
    })
  } catch (error) {
    console.error('Error listing users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function deleteUserByIdentifier(identifier: string) {
  console.log(`Looking up user: ${identifier}`)

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { id: identifier },
        { clerkUserId: identifier },
      ],
    },
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
              name: true,
            },
          },
        },
      },
    },
  })

  if (!user) {
    throw new Error(`User not found: ${identifier}`)
  }

  console.log(`\nFound user:`)
  console.log(`  ID: ${user.id}`)
  console.log(`  Email: ${user.email}`)
  console.log(`  Name: ${user.name}`)
  console.log(`  Clerk User ID: ${user.clerkUserId || 'N/A'}`)
  console.log(
    `  Organizations: ${user.organizationMemberships.map(m => m.organization.name).join(', ') || 'N/A'}`
  )
  console.log(`  Person: ${user.person?.name || 'N/A'}`)

  // Unlink person if linked
  if (user.personId) {
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
  if (user.clerkUserId) {
    console.log(`\nDeleting Clerk user: ${user.clerkUserId}`)
    const clerkDeleted = await deleteClerkUser(user.clerkUserId)
    if (clerkDeleted) {
      console.log('✓ Clerk user deleted')
    } else {
      console.log('⚠ Clerk user deletion skipped or failed')
    }
  } else {
    console.log('\nNo Clerk user ID found, skipping Clerk deletion')
  }

  // Delete organization memberships
  if (user.organizationMemberships.length > 0) {
    console.log(
      `\nDeleting ${user.organizationMemberships.length} organization membership(s)...`
    )
    await prisma.organizationMember.deleteMany({
      where: { userId: user.id },
    })
    console.log('✓ Organization memberships deleted')
  }

  // Delete database user
  console.log(`\nDeleting database user: ${user.id}`)
  await prisma.user.delete({
    where: { id: user.id },
  })
  console.log('✓ Database user deleted')

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
      // Interactive selection
      console.log('Loading users...')
      const users = await listUsers()

      if (users.length === 0) {
        console.log('No users found in the database.')
        return
      }

      const choices = users.map(user => ({
        name: formatUserForDisplay(user),
        value: user.email,
      }))

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

async function listOrganizations() {
  const organizations = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          users: true,
          people: true,
          teams: true,
          initiatives: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  return organizations
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
      console.log(`${index + 1}. ${org.name}`)
      console.log(`   Slug: ${org.slug}`)
      console.log(`   ID: ${org.id}`)
      console.log(`   Description: ${org.description || 'N/A'}`)
      console.log(`   Users: ${org._count.users}`)
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
    prisma.user.count({ where: { organizationId } }),
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

      const choices = organizations.map(org => ({
        name: `${org.name} (${org.slug}) - ${org._count.users} users, ${org._count.people} people`,
        value: org.slug,
      }))

      organizationSlug = await select({
        message: 'Select an organization to delete:',
        choices,
      })
    }

    console.log(`Looking up organization: ${organizationSlug}`)

    // Try to find organization by slug or ID
    const organization = await prisma.organization.findFirst({
      where: {
        OR: [{ slug: organizationSlug }, { id: organizationSlug }],
      },
    })

    if (!organization) {
      throw new Error(`Organization not found: ${organizationSlug}`)
    }

    console.log(`\nFound organization:`)
    console.log(`  ID: ${organization.id}`)
    console.log(`  Name: ${organization.name}`)
    console.log(`  Slug: ${organization.slug}`)
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
      message: `Are you sure you want to delete organization "${organization.name}" (${organization.slug})? This will delete ALL associated data and cannot be undone.`,
      default: false,
    })

    if (!confirmed) {
      console.log('Deletion cancelled.')
      return
    }

    // Delete users and their Clerk accounts first
    if (stats.userCount > 0) {
      console.log(`\nDeleting ${stats.userCount} user(s)...`)
      const users = await prisma.user.findMany({
        where: { organizationId: organization.id },
        select: {
          id: true,
          email: true,
          clerkUserId: true,
          personId: true,
        },
      })

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

    // Tasks
    const taskCount = await prisma.task.deleteMany({
      where: { createdBy: { organizationId: organization.id } },
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

    // Organization invitations
    const invitationCount = await prisma.organizationInvitation.deleteMany({
      where: { organizationId: organization.id },
    })
    if (invitationCount.count > 0) {
      console.log(`  ✓ Deleted ${invitationCount.count} invitation(s)`)
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

    // Finally, delete the organization
    console.log(
      `\nDeleting organization: ${organization.name} (${organization.id})`
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
