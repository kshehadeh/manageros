'use server'

import { prisma } from '@/lib/db'
import {
  getCurrentUser,
  getCurrentUserWithPersonAndOrganization,
} from '@/lib/auth-utils'

export interface PeopleStats {
  totalPeople: number
  directReports: number
  reportsWithoutRecentOneOnOne: number
  reportsWithoutRecentFeedback360: number
  managersExceedingMaxReports: number
  hasMaxReportsRule: boolean
  statusBreakdown: Array<{ status: string; count: number }>
  teamBreakdown: Array<{ teamName: string | null; count: number }>
  jobRoleBreakdown: Array<{ jobRoleTitle: string | null; count: number }>
}

/**
 * Get aggregated people statistics for the dashboard
 * All queries are filtered by organization for security
 */
export async function getPeopleStats(): Promise<PeopleStats | null> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    return null
  }

  const organizationId = user.managerOSOrganizationId

  // Get current person for direct reports count
  const { person } = await getCurrentUserWithPersonAndOrganization()
  const currentPersonId = person?.id

  // Get tolerance rules for 1-on-1 frequency and 360 feedback to determine thresholds
  const [oneOnOneRule, feedback360Rule] = await Promise.all([
    prisma.organizationToleranceRule.findFirst({
      where: {
        organizationId,
        ruleType: 'one_on_one_frequency',
        isEnabled: true,
      },
    }),
    prisma.organizationToleranceRule.findFirst({
      where: {
        organizationId,
        ruleType: 'feedback_360',
        isEnabled: true,
      },
    }),
  ])

  // Get 1-on-1 tolerance threshold (default to 14 days if no rule configured)
  let toleranceThresholdDays = 14
  if (oneOnOneRule) {
    const config = oneOnOneRule.config as {
      warningThresholdDays?: number
      urgentThresholdDays?: number
    }
    // Use warning threshold if available, otherwise urgent, otherwise default
    toleranceThresholdDays =
      config.warningThresholdDays || config.urgentThresholdDays || 14
  }

  // Get 360 feedback tolerance threshold (default to 6 months if no rule configured)
  let feedback360ThresholdMonths = 6
  if (feedback360Rule) {
    const config = feedback360Rule.config as {
      warningThresholdMonths?: number
    }
    feedback360ThresholdMonths = config.warningThresholdMonths || 6
  }

  // Execute all queries in parallel for better performance
  const [
    totalPeople,
    directReports,
    statusBreakdown,
    teamBreakdown,
    jobRoleBreakdown,
  ] = await Promise.all([
    // Total people count
    prisma.person.count({
      where: {
        organizationId,
      },
    }),

    // Direct reports count (only if user has linked person)
    currentPersonId
      ? prisma.person.count({
          where: {
            organizationId,
            managerId: currentPersonId,
          },
        })
      : Promise.resolve(0),

    // Status breakdown
    prisma.person.groupBy({
      by: ['status'],
      where: {
        organizationId,
      },
      _count: {
        id: true,
      },
    }),

    // Team breakdown
    prisma.person.groupBy({
      by: ['teamId'],
      where: {
        organizationId,
      },
      _count: {
        id: true,
      },
    }),

    // Job role breakdown
    prisma.person.groupBy({
      by: ['jobRoleId'],
      where: {
        organizationId,
      },
      _count: {
        id: true,
      },
    }),
  ])

  // Get team names for team breakdown
  const teamIds = teamBreakdown
    .map(item => item.teamId)
    .filter((id): id is string => id !== null)

  const teams =
    teamIds.length > 0
      ? await prisma.team.findMany({
          where: {
            id: { in: teamIds },
            organizationId,
          },
          select: {
            id: true,
            name: true,
          },
        })
      : []

  const teamMap = new Map(teams.map(team => [team.id, team.name]))

  // Get job role titles for job role breakdown
  const jobRoleIds = jobRoleBreakdown
    .map(item => item.jobRoleId)
    .filter((id): id is string => id !== null)

  const jobRoles =
    jobRoleIds.length > 0
      ? await prisma.jobRole.findMany({
          where: {
            id: { in: jobRoleIds },
            organizationId,
          },
          select: {
            id: true,
            title: true,
          },
        })
      : []

  const jobRoleMap = new Map(jobRoles.map(role => [role.id, role.title]))

  // Count reports without recent 1-on-1 (only if user has linked person)
  let reportsWithoutRecentOneOnOne = 0
  if (currentPersonId) {
    // Get all direct reports
    const directReportIds = await prisma.person.findMany({
      where: {
        organizationId,
        managerId: currentPersonId,
        status: 'active',
      },
      select: {
        id: true,
      },
    })

    if (directReportIds.length > 0) {
      const reportIds = directReportIds.map(r => r.id)
      const cutoffDate = new Date(
        Date.now() - toleranceThresholdDays * 24 * 60 * 60 * 1000
      )

      // Get all 1-on-1s for these manager-report pairs (not just recent ones)
      // Check both directions (manager->report and report->manager)
      const oneOnOnes = await prisma.oneOnOne.findMany({
        where: {
          OR: [
            {
              managerId: currentPersonId,
              reportId: { in: reportIds },
            },
            {
              managerId: { in: reportIds },
              reportId: currentPersonId,
            },
          ],
          scheduledAt: {
            not: null,
          },
        },
        select: {
          managerId: true,
          reportId: true,
          scheduledAt: true,
        },
        orderBy: {
          scheduledAt: 'desc',
        },
      })

      // Create a map of reportId -> most recent scheduledAt
      const reportLastOneOnOneMap = new Map<string, Date>()
      for (const oneOnOne of oneOnOnes) {
        if (!oneOnOne.scheduledAt) continue

        // Determine which person is the report (the one that's not the current person)
        const reportId =
          oneOnOne.managerId === currentPersonId
            ? oneOnOne.reportId
            : oneOnOne.managerId

        const existing = reportLastOneOnOneMap.get(reportId)
        if (!existing || oneOnOne.scheduledAt > existing) {
          reportLastOneOnOneMap.set(reportId, oneOnOne.scheduledAt)
        }
      }

      // Count reports that don't have a recent 1-on-1
      for (const reportId of reportIds) {
        const lastOneOnOne = reportLastOneOnOneMap.get(reportId)
        if (!lastOneOnOne || lastOneOnOne < cutoffDate) {
          // No 1-on-1 found or last one is outside tolerance period
          reportsWithoutRecentOneOnOne++
        }
      }
    }
  }

  // Count reports without recent 360 feedback campaign (only if user has linked person)
  let reportsWithoutRecentFeedback360 = 0
  if (currentPersonId) {
    // Get all direct reports
    const directReportIds = await prisma.person.findMany({
      where: {
        organizationId,
        managerId: currentPersonId,
        status: 'active',
      },
      select: {
        id: true,
      },
    })

    if (directReportIds.length > 0) {
      const reportIds = directReportIds.map(r => r.id)
      const cutoffDate = new Date(
        Date.now() - feedback360ThresholdMonths * 30 * 24 * 60 * 60 * 1000
      )

      // Get all feedback campaigns for these reports
      const feedbackCampaigns = await prisma.feedbackCampaign.findMany({
        where: {
          targetPersonId: {
            in: reportIds,
          },
        },
        select: {
          targetPersonId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Create a map of reportId -> most recent campaign createdAt
      const reportLastCampaignMap = new Map<string, Date>()
      for (const campaign of feedbackCampaigns) {
        const existing = reportLastCampaignMap.get(campaign.targetPersonId)
        if (!existing || campaign.createdAt > existing) {
          reportLastCampaignMap.set(campaign.targetPersonId, campaign.createdAt)
        }
      }

      // Count reports that don't have a recent feedback campaign
      for (const reportId of reportIds) {
        const lastCampaign = reportLastCampaignMap.get(reportId)
        if (!lastCampaign || lastCampaign < cutoffDate) {
          // No campaign found or last one is outside tolerance period
          reportsWithoutRecentFeedback360++
        }
      }
    }
  }

  // Count managers exceeding manager span threshold (only if manager_span rule exists)
  let managersExceedingMaxReports = 0
  let hasMaxReportsRule = false
  const managerSpanRule = await prisma.organizationToleranceRule.findFirst({
    where: {
      organizationId,
      ruleType: 'manager_span',
      isEnabled: true,
    },
  })

  if (managerSpanRule) {
    hasMaxReportsRule = true
    // Count active exceptions for manager_span rule
    managersExceedingMaxReports = await prisma.exception.count({
      where: {
        organizationId,
        ruleId: managerSpanRule.id,
        entityType: 'Person',
        status: 'active',
      },
    })
  }

  return {
    totalPeople,
    directReports,
    reportsWithoutRecentOneOnOne,
    reportsWithoutRecentFeedback360,
    managersExceedingMaxReports,
    hasMaxReportsRule,
    statusBreakdown: statusBreakdown.map(item => ({
      status: item.status,
      count: item._count.id,
    })),
    teamBreakdown: teamBreakdown.map(item => ({
      teamName: item.teamId ? teamMap.get(item.teamId) || null : null,
      count: item._count.id,
    })),
    jobRoleBreakdown: jobRoleBreakdown.map(item => ({
      jobRoleTitle: item.jobRoleId
        ? jobRoleMap.get(item.jobRoleId) || null
        : null,
      count: item._count.id,
    })),
  }
}
