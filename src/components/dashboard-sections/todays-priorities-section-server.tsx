import { getCurrentUser } from '@/lib/auth-utils'
import {
  TodaysPrioritiesSection,
  type PriorityItem,
} from './todays-priorities-section'
import { getTasksForAssignee } from '@/lib/data/tasks'
import {
  getUpcomingMeetingInstancesForPerson,
  getUpcomingNonRecurringMeetingsForPerson,
} from '@/lib/data/meetings'
import { getUpcomingOneOnOnesForPerson } from '@/lib/data/one-on-ones'
import { getActiveFeedbackCampaignsForUser } from '@/lib/data/feedback-campaigns'

export async function TodaysPrioritiesSectionServer() {
  try {
    const user = await getCurrentUser()

    if (!user.managerOSOrganizationId || !user.managerOSPersonId) {
      return null
    }

    const now = new Date()
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const priorityItems: PriorityItem[] = []

    // Fetch incomplete tasks assigned to the current user
    const tasks = await getTasksForAssignee(
      user.managerOSPersonId,
      user.managerOSOrganizationId,
      user.managerOSUserId || '',
      {
        excludeStatus: ['done', 'dropped'],
        limit: 10,
      }
    )

    tasks.forEach(task => {
      priorityItems.push({
        id: task.id,
        type: 'task',
        title: task.title,
        date: task.dueDate,
        href: `/tasks/${task.id}`,
        status: task.status,
        description: task.description,
        assigneeId: task.assigneeId,
        priority: task.priority,
      })
    })

    // Fetch upcoming meeting instances where user is a participant
    const meetingInstancesResult = await getUpcomingMeetingInstancesForPerson(
      user.managerOSPersonId,
      user.managerOSOrganizationId,
      now,
      oneWeekFromNow,
      {
        limit: 5,
        includeMeeting: true,
      }
    )

    // Type assertion: when includeMeeting is true, meeting will be included
    const meetingInstances = meetingInstancesResult as Array<
      (typeof meetingInstancesResult)[0] & {
        meeting: { title: string }
      }
    >

    meetingInstances.forEach(instance => {
      priorityItems.push({
        id: instance.id,
        type: 'meeting',
        title: instance.meeting.title,
        date: instance.scheduledAt,
        href: `/meetings/${instance.meetingId}/instances/${instance.id}`,
      })
    })

    // Fetch non-recurring meetings where user is a participant
    const nonRecurringMeetings = await getUpcomingNonRecurringMeetingsForPerson(
      user.managerOSPersonId,
      user.managerOSOrganizationId,
      user.managerOSUserId || '',
      now,
      oneWeekFromNow,
      {
        limit: 5,
      }
    )

    nonRecurringMeetings.forEach(meeting => {
      priorityItems.push({
        id: meeting.id,
        type: 'meeting',
        title: meeting.title,
        date: meeting.scheduledAt,
        href: `/meetings/${meeting.id}`,
      })
    })

    // Fetch upcoming 1:1s
    const oneOnOnesResult = await getUpcomingOneOnOnesForPerson(
      user.managerOSPersonId,
      now,
      oneWeekFromNow,
      {
        limit: 5,
        includeManager: true,
        includeReport: true,
      }
    )

    // Type assertion: when includeManager and includeReport are true, they will be included
    const oneOnOnes = oneOnOnesResult as Array<
      (typeof oneOnOnesResult)[0] & {
        manager: { name: string } | null
        report: { name: string } | null
      }
    >

    oneOnOnes.forEach(ooo => {
      const otherPerson =
        user.managerOSPersonId === ooo.managerId ? ooo.report : ooo.manager
      if (!otherPerson) return
      priorityItems.push({
        id: ooo.id,
        type: 'oneonone',
        title: `1:1 with ${otherPerson.name}`,
        date: ooo.scheduledAt,
        href: `/oneonones/${ooo.id}`,
      })
    })

    // Fetch active feedback campaigns created by user (ending within a week, or all active if none ending soon)
    const feedbackCampaignsResult = await getActiveFeedbackCampaignsForUser(
      user.managerOSUserId || '',
      user.managerOSOrganizationId,
      {
        endDateAfter: now,
        limit: 5,
        includeTargetPerson: true,
      }
    )

    // Type assertion: when includeTargetPerson is true, targetPerson will be included
    const feedbackCampaigns = feedbackCampaignsResult as Array<
      (typeof feedbackCampaignsResult)[0] & {
        targetPerson: { id: string; name: string; email: string | null }
      }
    >

    feedbackCampaigns.forEach(campaign => {
      priorityItems.push({
        id: campaign.id,
        type: 'feedback',
        title: `Feedback: ${campaign.targetPerson.name}`,
        date: campaign.endDate,
        href: `/people/${campaign.targetPersonId}/feedback-campaigns/${campaign.id}`,
        metadata: campaign.name || undefined,
      })
    })

    return <TodaysPrioritiesSection items={priorityItems} />
  } catch {
    return null
  }
}
