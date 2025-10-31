import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { getTaskAccessWhereClause } from '@/lib/task-access-utils'
import {
  TodaysPrioritiesSection,
  type PriorityItem,
} from './todays-priorities-section'

export async function TodaysPrioritiesSectionServer() {
  const user = await getCurrentUser()

  if (!user.organizationId || !user.personId) {
    return null
  }

  const now = new Date()
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const priorityItems: PriorityItem[] = []

  // Fetch incomplete tasks assigned to the current user
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: user.personId,
      status: {
        notIn: ['done', 'dropped'],
      },
      ...getTaskAccessWhereClause(user.organizationId, user.id, user.personId),
    },
    orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }],
    take: 10,
  })

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
    include: {
      meeting: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      scheduledAt: 'asc',
    },
    take: 5,
  })

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
    select: {
      id: true,
      title: true,
      scheduledAt: true,
    },
    orderBy: {
      scheduledAt: 'asc',
    },
    take: 5,
  })

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
  const oneOnOnes = await prisma.oneOnOne.findMany({
    where: {
      OR: [{ managerId: user.personId }, { reportId: user.personId }],
      scheduledAt: {
        gte: now,
        lte: oneWeekFromNow,
      },
    },
    include: {
      manager: {
        select: {
          name: true,
        },
      },
      report: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      scheduledAt: 'asc',
    },
    take: 5,
  })

  oneOnOnes.forEach(ooo => {
    const otherPerson =
      user.personId === ooo.managerId ? ooo.report : ooo.manager
    priorityItems.push({
      id: ooo.id,
      type: 'oneonone',
      title: `1:1 with ${otherPerson.name}`,
      date: ooo.scheduledAt,
      href: `/oneonones/${ooo.id}`,
    })
  })

  // Fetch active feedback campaigns created by user (ending within a week, or all active if none ending soon)
  const feedbackCampaigns = await prisma.feedbackCampaign.findMany({
    where: {
      userId: user.id,
      status: 'active',
      endDate: {
        gte: now,
      },
      targetPerson: {
        organizationId: user.organizationId,
      },
    },
    include: {
      targetPerson: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      endDate: 'asc',
    },
    take: 5,
  })

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
}
