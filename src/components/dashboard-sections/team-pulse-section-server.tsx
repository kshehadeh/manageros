import { getCurrentUser } from '@/lib/auth-utils'
import { TeamPulseSection } from './team-pulse-section'
import { isFuture } from 'date-fns'
import { getDirectReports } from '@/lib/data/people'
import { getOneOnOnesForManagerAndReports } from '@/lib/data/one-on-ones'
import { getTasksForAssignee } from '@/lib/data/tasks'
import { getActiveFeedbackCampaignsForUser } from '@/lib/data/feedback-campaigns'

interface TeamPulseMember {
  id: string
  name: string
  avatar: string | null
  nextOneOnOne: Date | null
  lastOneOnOne: Date | null
  taskCount: number
  feedbackPending: boolean
}

export async function TeamPulseSectionServer() {
  const user = await getCurrentUser()

  if (!user.organizationId || !user.personId) {
    return null
  }

  // Type guard: ensure these are strings after the check
  const organizationId: string = user.organizationId
  const personId: string = user.personId
  const userId: string = user.id

  // Get current person's direct reports
  const directReportsResult = await getDirectReports(personId, organizationId, {
    limit: 10,
    includeOnlyFields: true,
  })

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
          new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
        )
      })

    const lastOneOnOne = pastOneOnOnes[0]?.scheduledAt || null

    // Count tasks
    const taskCount = tasks.filter(t => t.assigneeId === report.id).length

    // Check for pending feedback
    const feedbackPending = feedbackCampaigns.some(
      fc => fc.targetPersonId === report.id
    )

    return {
      id: report.id,
      name: report.name,
      avatar: report.avatar,
      nextOneOnOne: upcomingOneOnOne?.scheduledAt || null,
      lastOneOnOne,
      taskCount,
      feedbackPending,
    }
  })

  return <TeamPulseSection members={teamMembers} />
}
