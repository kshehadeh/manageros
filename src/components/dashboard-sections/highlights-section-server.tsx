import { getCurrentUser } from '@/lib/auth-utils'
import { HighlightsSection } from './highlights-section'
import { getOverdueTasksForAssignee } from '@/lib/data/tasks'
import { getUpcomingOneOnOnesForPerson } from '@/lib/data/one-on-ones'
import {
  getUpcomingMeetingInstancesForPerson,
  getUpcomingNonRecurringMeetingsForPerson,
} from '@/lib/data/meetings'
import { getActiveFeedbackCampaignsForUser } from '@/lib/data/feedback-campaigns'

export async function HighlightsSectionServer() {
  try {
    const user = await getCurrentUser()

    if (!user.managerOSOrganizationId || !user.managerOSPersonId) {
      return (
        <HighlightsSection
          overdueTasksCount={0}
          upcomingOneOnOnesCount={0}
          upcomingMeetingsCount={0}
          reviewsDueCount={0}
        />
      )
    }

    const now = new Date()
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Count overdue tasks
    const overdueTasks = await getOverdueTasksForAssignee(
      user.managerOSPersonId,
      user.managerOSOrganizationId,
      user.managerOSUserId,
      startOfToday
    )

    // Count upcoming 1:1s (scheduled in the future)
    const upcomingOneOnOnes = await getUpcomingOneOnOnesForPerson(
      user.managerOSPersonId,
      now,
      oneWeekFromNow
    )

    // Count upcoming meetings (instances and non-recurring)
    const [meetingInstances, nonRecurringMeetings] = await Promise.all([
      getUpcomingMeetingInstancesForPerson(
        user.managerOSPersonId,
        user.managerOSOrganizationId,
        now,
        oneWeekFromNow
      ),
      getUpcomingNonRecurringMeetingsForPerson(
        user.managerOSPersonId,
        user.managerOSOrganizationId,
        user.managerOSUserId,
        now,
        oneWeekFromNow
      ),
    ])

    const upcomingMeetingsCount =
      meetingInstances.length + nonRecurringMeetings.length

    // Count reviews due (feedback campaigns ending soon)
    const reviewsDue = await getActiveFeedbackCampaignsForUser(
      user.managerOSUserId,
      user.managerOSOrganizationId,
      {
        endDateAfter: startOfToday,
        endDateBefore: oneWeekFromNow,
      }
    )

    return (
      <HighlightsSection
        overdueTasksCount={overdueTasks.length}
        upcomingOneOnOnesCount={upcomingOneOnOnes.length}
        upcomingMeetingsCount={upcomingMeetingsCount}
        reviewsDueCount={reviewsDue.length}
      />
    )
  } catch {
    return (
      <HighlightsSection
        overdueTasksCount={0}
        upcomingOneOnOnesCount={0}
        upcomingMeetingsCount={0}
        reviewsDueCount={0}
      />
    )
  }
}
