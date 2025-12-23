'use server'

import { prisma } from '@/lib/db'
import {
  getCurrentUser,
  getCurrentUserWithPersonAndOrganization,
} from '@/lib/auth-utils'
import type { PersonForList } from '@/components/people/person-list'

/**
 * Get list of direct reports who haven't had a 1-on-1 within the tolerance period
 */
export async function getReportsWithoutRecentOneOnOne(): Promise<
  PersonForList[]
> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    return []
  }

  const organizationId = user.managerOSOrganizationId
  const { person } = await getCurrentUserWithPersonAndOrganization()
  const currentPersonId = person?.id

  if (!currentPersonId) {
    return []
  }

  // Get tolerance rule for 1-on-1 frequency
  const toleranceRule = await prisma.organizationToleranceRule.findFirst({
    where: {
      organizationId,
      ruleType: 'one_on_one_frequency',
      isEnabled: true,
    },
  })

  let toleranceThresholdDays = 14
  if (toleranceRule) {
    const config = toleranceRule.config as {
      warningThresholdDays?: number
      urgentThresholdDays?: number
    }
    toleranceThresholdDays =
      config.warningThresholdDays || config.urgentThresholdDays || 14
  }

  // Get all direct reports with relations
  const directReports = await prisma.person.findMany({
    where: {
      organizationId,
      managerId: currentPersonId,
      status: 'active',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      avatar: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      jobRole: {
        include: {
          level: {
            select: {
              id: true,
              name: true,
            },
          },
          domain: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      manager: {
        include: {
          reports: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
              birthday: true,
            },
          },
        },
      },
      reports: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          birthday: true,
        },
      },
    },
  })

  if (directReports.length === 0) {
    return []
  }

  const reportIds = directReports.map(r => r.id)
  const cutoffDate = new Date(
    Date.now() - toleranceThresholdDays * 24 * 60 * 60 * 1000
  )

  // Get all 1-on-1s for these manager-report pairs
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

    const reportId =
      oneOnOne.managerId === currentPersonId
        ? oneOnOne.reportId
        : oneOnOne.managerId

    const existing = reportLastOneOnOneMap.get(reportId)
    if (!existing || oneOnOne.scheduledAt > existing) {
      reportLastOneOnOneMap.set(reportId, oneOnOne.scheduledAt)
    }
  }

  // Filter reports that don't have a recent 1-on-1
  const reportsNeedingOneOnOne = directReports.filter(report => {
    const lastOneOnOne = reportLastOneOnOneMap.get(report.id)
    return !lastOneOnOne || lastOneOnOne < cutoffDate
  })

  // Convert to PersonForList format
  return reportsNeedingOneOnOne.map(report => {
    return {
      id: report.id,
      name: report.name,
      email: report.email,
      role: report.role,
      status: report.status,
      avatar: report.avatar,
      team: report.team
        ? {
            id: report.team.id,
            name: report.team.name,
          }
        : null,
      jobRole: report.jobRole
        ? {
            id: report.jobRole.id,
            title: report.jobRole.title,
            level: report.jobRole.level
              ? {
                  id: report.jobRole.level.id,
                  name: report.jobRole.level.name,
                }
              : null,
            domain: report.jobRole.domain
              ? {
                  id: report.jobRole.domain.id,
                  name: report.jobRole.domain.name,
                }
              : null,
          }
        : null,
      manager: report.manager
        ? {
            id: report.manager.id,
            name: report.manager.name,
            email: report.manager.email,
            role: report.manager.role,
            status: report.manager.status,
            birthday: report.manager.birthday,
            reports: report.manager.reports,
          }
        : null,
      reports: report.reports,
    }
  })
}

/**
 * Get list of direct reports who haven't had a 360 feedback campaign within the tolerance period
 */
export async function getReportsWithoutRecentFeedback360(): Promise<
  PersonForList[]
> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    return []
  }

  const organizationId = user.managerOSOrganizationId
  const { person } = await getCurrentUserWithPersonAndOrganization()
  const currentPersonId = person?.id

  if (!currentPersonId) {
    return []
  }

  // Get tolerance rule for 360 feedback
  const toleranceRule = await prisma.organizationToleranceRule.findFirst({
    where: {
      organizationId,
      ruleType: 'feedback_360',
      isEnabled: true,
    },
  })

  let feedback360ThresholdMonths = 6
  if (toleranceRule) {
    const config = toleranceRule.config as {
      warningThresholdMonths?: number
    }
    feedback360ThresholdMonths = config.warningThresholdMonths || 6
  }

  // Get all direct reports with relations
  const directReports = await prisma.person.findMany({
    where: {
      organizationId,
      managerId: currentPersonId,
      status: 'active',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      avatar: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      jobRole: {
        include: {
          level: {
            select: {
              id: true,
              name: true,
            },
          },
          domain: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      manager: {
        include: {
          reports: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
              birthday: true,
            },
          },
        },
      },
      reports: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          birthday: true,
        },
      },
    },
  })

  if (directReports.length === 0) {
    return []
  }

  const reportIds = directReports.map(r => r.id)
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

  // Filter reports that don't have a recent feedback campaign
  const reportsNeedingFeedback360 = directReports.filter(report => {
    const lastCampaign = reportLastCampaignMap.get(report.id)
    return !lastCampaign || lastCampaign < cutoffDate
  })

  // Convert to PersonForList format
  return reportsNeedingFeedback360.map(report => {
    return {
      id: report.id,
      name: report.name,
      email: report.email,
      role: report.role,
      status: report.status,
      avatar: report.avatar,
      team: report.team
        ? {
            id: report.team.id,
            name: report.team.name,
          }
        : null,
      jobRole: report.jobRole
        ? {
            id: report.jobRole.id,
            title: report.jobRole.title,
            level: report.jobRole.level
              ? {
                  id: report.jobRole.level.id,
                  name: report.jobRole.level.name,
                }
              : null,
            domain: report.jobRole.domain
              ? {
                  id: report.jobRole.domain.id,
                  name: report.jobRole.domain.name,
                }
              : null,
          }
        : null,
      manager: report.manager
        ? {
            id: report.manager.id,
            name: report.manager.name,
            email: report.manager.email,
            role: report.manager.role,
            status: report.manager.status,
            birthday: report.manager.birthday,
            reports: report.manager.reports,
          }
        : null,
      reports: report.reports,
    }
  })
}

/**
 * Get list of managers who are exceeding the max reports threshold
 */
export async function getManagersExceedingMaxReports(): Promise<
  PersonForList[]
> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    return []
  }

  const organizationId = user.managerOSOrganizationId

  // Get tolerance rule for max reports
  const toleranceRule = await prisma.organizationToleranceRule.findFirst({
    where: {
      organizationId,
      ruleType: 'max_reports',
      isEnabled: true,
    },
  })

  if (!toleranceRule) {
    return []
  }

  // Get all active exceptions for max_reports rule
  const exceptions = await prisma.exception.findMany({
    where: {
      organizationId,
      ruleId: toleranceRule.id,
      entityType: 'Person',
      status: 'active',
    },
    select: {
      entityId: true,
    },
  })

  if (exceptions.length === 0) {
    return []
  }

  // Get person IDs from exceptions
  const personIds = exceptions.map(e => e.entityId)

  // Get all people with relations
  const people = await prisma.person.findMany({
    where: {
      id: { in: personIds },
      organizationId,
      status: 'active',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      avatar: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      jobRole: {
        include: {
          level: {
            select: {
              id: true,
              name: true,
            },
          },
          domain: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      manager: {
        include: {
          reports: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
              birthday: true,
            },
          },
        },
      },
      reports: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          birthday: true,
        },
      },
    },
  })

  // Convert to PersonForList format
  return people.map(person => {
    return {
      id: person.id,
      name: person.name,
      email: person.email,
      role: person.role,
      status: person.status,
      avatar: person.avatar,
      team: person.team
        ? {
            id: person.team.id,
            name: person.team.name,
          }
        : null,
      jobRole: person.jobRole
        ? {
            id: person.jobRole.id,
            title: person.jobRole.title,
            level: person.jobRole.level
              ? {
                  id: person.jobRole.level.id,
                  name: person.jobRole.level.name,
                }
              : null,
            domain: person.jobRole.domain
              ? {
                  id: person.jobRole.domain.id,
                  name: person.jobRole.domain.name,
                }
              : null,
          }
        : null,
      manager: person.manager
        ? {
            id: person.manager.id,
            name: person.manager.name,
            email: person.manager.email,
            role: person.manager.role,
            status: person.manager.status,
            birthday: person.manager.birthday,
            reports: person.manager.reports,
          }
        : null,
      reports: person.reports,
    }
  })
}
