import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { HighlightsSection } from './highlights-section'
import { getTaskAccessWhereClause } from '@/lib/task-access-utils'

export async function HighlightsSectionServer() {
  const user = await getCurrentUser()

  if (!user.organizationId || !user.personId) {
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
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Count overdue tasks
  const overdueTasks = await prisma.task.findMany({
    where: {
      assigneeId: user.personId,
      dueDate: {
        lt: startOfToday,
      },
      status: {
        notIn: ['done', 'dropped'],
      },
      ...getTaskAccessWhereClause(user.organizationId, user.id, user.personId),
    },
  })

  // Count upcoming 1:1s (scheduled in the future)
  const upcomingOneOnOnes = await prisma.oneOnOne.findMany({
    where: {
      OR: [{ managerId: user.personId }, { reportId: user.personId }],
      scheduledAt: {
        gte: now,
        lte: oneWeekFromNow,
      },
    },
  })

  // Count upcoming meetings (instances and non-recurring)
  const meetingInstances = await prisma.meetingInstance.findMany({
    where: {
      scheduledAt: {
        gte: now,
        lte: oneWeekFromNow,
      },
      OR: [
        {
          meeting: {
            participants: {
              some: {
                personId: user.personId,
              },
            },
          },
        },
        {
          participants: {
            some: {
              personId: user.personId,
            },
          },
        },
      ],
      meeting: {
        organizationId: user.organizationId,
      },
    },
  })

  const nonRecurringMeetings = await prisma.meeting.findMany({
    where: {
      isRecurring: false,
      scheduledAt: {
        gte: now,
        lte: oneWeekFromNow,
      },
      organizationId: user.organizationId,
      OR: [
        {
          participants: {
            some: {
              personId: user.personId,
            },
          },
        },
        {
          createdById: user.id,
        },
      ],
    },
  })

  const upcomingMeetingsCount = meetingInstances.length + nonRecurringMeetings.length

  // Count reviews due (feedback campaigns ending soon)
  const reviewsDue = await prisma.feedbackCampaign.findMany({
    where: {
      userId: user.id,
      status: 'active',
      endDate: {
        gte: startOfToday,
        lte: oneWeekFromNow,
      },
      targetPerson: {
        organizationId: user.organizationId,
      },
    },
  })

  return (
    <HighlightsSection
      overdueTasksCount={overdueTasks.length}
      upcomingOneOnOnesCount={upcomingOneOnOnes.length}
      upcomingMeetingsCount={upcomingMeetingsCount}
      reviewsDueCount={reviewsDue.length}
    />
  )
}
