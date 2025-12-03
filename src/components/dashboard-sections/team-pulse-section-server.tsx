import { getCurrentUser } from '@/lib/auth-utils'
import { TeamPulseSection } from './team-pulse-section'
import { isFuture } from 'date-fns'
import { getDirectReports } from '@/lib/data/people'
import { getOneOnOnesForManagerAndReports } from '@/lib/data/one-on-ones'
import { getTasksForAssignee } from '@/lib/data/tasks'
import { getActiveFeedbackCampaignsForUser } from '@/lib/data/feedback-campaigns'
import { prisma } from '@/lib/db'

interface TeamPulseMember {
  id: string
  name: string
  avatar: string | null
  nextOneOnOne: Date | null
  lastOneOnOne: Date | null
  taskCount: number
  feedbackPending: boolean
  hasRecentNegativeFeedback: boolean
  hasRecentPositiveFeedback: boolean
}

export async function TeamPulseSectionServer() {
  try {
    const user = await getCurrentUser()

    if (!user.managerOSOrganizationId || !user.managerOSPersonId) {
      return null
    }

    // Type guard: ensure these are strings after the check
    const organizationId: string = user.managerOSOrganizationId
    const personId: string = user.managerOSPersonId
    const userId: string = user.managerOSUserId

    // Get current person's direct reports
    const directReportsResult = await getDirectReports(
      personId,
      organizationId,
      {
        limit: 10,
        includeOnlyFields: true,
      }
    )

    if (directReportsResult.length === 0) {
      return null
    }

    // Type assertion: when includeOnlyFields is true, id will be a string
    const directReports = directReportsResult as Array<{
      id: string
      name: string
      avatar: string | null
    }>

    // Get 1:1 meetings for each report
    const reportIds: string[] = directReports.map(r => r.id)
    const oneOnOnes = await getOneOnOnesForManagerAndReports(
      personId,
      reportIds,
      organizationId,
      {
        includeScheduledAt: true,
      }
    )

    // Get task counts for each report
    const allTasks = await Promise.all(
      reportIds.map((reportId: string) =>
        getTasksForAssignee(reportId, organizationId, userId, {
          excludeStatus: ['done', 'dropped'],
        })
      )
    )
    const tasks = allTasks.flat()

    // Get pending feedback campaigns
    const feedbackCampaigns = await getActiveFeedbackCampaignsForUser(
      userId,
      organizationId,
      {
        targetPersonIds: reportIds,
        endDateAfter: new Date(),
      }
    )

    // Get current person's person record for feedback access control
    const currentPerson = await prisma.person.findFirst({
      where: {
        id: personId,
        organizationId,
      },
    })

    // Get recent feedback for all reports (last 30 days)
    // Only show feedback that is either public or private feedback from current user
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentFeedback = await prisma.feedback.findMany({
      where: {
        aboutId: {
          in: reportIds,
        },
        about: {
          organizationId,
        },
        createdAt: {
          gte: thirtyDaysAgo,
        },
        OR: [
          { isPrivate: false },
          ...(currentPerson ? [{ fromId: currentPerson.id }] : []),
        ],
      },
      select: {
        aboutId: true,
        kind: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Build the team pulse data
    const teamMembers: TeamPulseMember[] = directReports.map(report => {
      // Find upcoming 1:1
      const upcomingOneOnOne = oneOnOnes.find(
        ooo =>
          ((ooo.managerId === personId && ooo.reportId === report.id) ||
            (ooo.reportId === personId && ooo.managerId === report.id)) &&
          ooo.scheduledAt &&
          isFuture(new Date(ooo.scheduledAt))
      )

      // Find most recent past 1:1
      const pastOneOnOnes = oneOnOnes
        .filter(
          ooo =>
            ((ooo.managerId === personId && ooo.reportId === report.id) ||
              (ooo.reportId === personId && ooo.managerId === report.id)) &&
            ooo.scheduledAt &&
            !isFuture(new Date(ooo.scheduledAt))
        )
        .sort((a, b) => {
          if (!a.scheduledAt || !b.scheduledAt) return 0
          return (
            new Date(b.scheduledAt).getTime() -
            new Date(a.scheduledAt).getTime()
          )
        })

      const lastOneOnOne = pastOneOnOnes[0]?.scheduledAt || null

      // Count tasks
      const taskCount = tasks.filter(t => t.assigneeId === report.id).length

      // Check for pending feedback
      const feedbackPending = feedbackCampaigns.some(
        fc => fc.targetPersonId === report.id
      )

      // Check for recent feedback (last 30 days)
      const reportFeedback = recentFeedback.filter(f => f.aboutId === report.id)
      const hasRecentNegativeFeedback = reportFeedback.some(
        f => f.kind === 'concern'
      )
      const hasRecentPositiveFeedback = reportFeedback.some(
        f => f.kind === 'praise'
      )

      return {
        id: report.id,
        name: report.name,
        avatar: report.avatar,
        nextOneOnOne: upcomingOneOnOne?.scheduledAt || null,
        lastOneOnOne,
        taskCount,
        feedbackPending,
        hasRecentNegativeFeedback,
        hasRecentPositiveFeedback,
      }
    })

    return <TeamPulseSection members={teamMembers} />
  } catch {
    return null
  }
}
