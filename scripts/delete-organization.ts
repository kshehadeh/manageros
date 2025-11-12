#!/usr/bin/env bun

/**
 * Development script to delete an organization from the database
 * Also deletes all associated users and their Clerk accounts
 *
 * Usage:
 *   bun scripts/delete-organization.ts <id|slug>
 *
 * Examples:
 *   bun scripts/delete-organization.ts acme-corp
 *   bun scripts/delete-organization.ts org_xxxxx
 *
 * WARNING: This script is for development use only!
 */

import { prisma } from '../src/lib/db'

// Check if we're in development
if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: This script can only be run in development mode!')
  console.error('Set NODE_ENV to "development" or unset it to use this script.')
  process.exit(1)
}

/**
 * Delete a Clerk user by ID
 */
async function deleteClerkUser(clerkUserId: string) {
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

/**
 * Get counts of related data for an organization
 */
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

/**
 * Main function to delete an organization
 */
async function deleteOrganization(identifier: string) {
  try {
    console.log(`Looking up organization: ${identifier}`)

    // Try to find organization by slug or ID
    const organization = await prisma.organization.findFirst({
      where: {
        OR: [{ slug: identifier }, { id: identifier }],
      },
    })

    if (!organization) {
      console.error(`Organization not found: ${identifier}`)
      process.exit(1)
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

    // Delete users and their Clerk accounts first
    if (stats.userCount > 0) {
      console.log(`\nDeleting ${stats.userCount} user(s)...`)
      const users = await prisma.user.findMany({
        where: { organizationId: organization.id },
        select: { id: true, email: true, clerkUserId: true, personId: true },
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
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Main execution
const identifier = process.argv[2]

if (!identifier) {
  console.error('Usage: bun scripts/delete-organization.ts <id|slug>')
  console.error('\nExamples:')
  console.error('  bun scripts/delete-organization.ts acme-corp')
  console.error('  bun scripts/delete-organization.ts org_xxxxx')
  process.exit(1)
}

deleteOrganization(identifier)
