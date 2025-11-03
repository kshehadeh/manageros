import 'server-only'

import { cache } from 'react'
import { prisma } from '@/lib/db'

export const getUpcomingMeetingInstancesForPerson = cache(
  async (
    personId: string,
    organizationId: string,
    dateAfter: Date,
    dateBefore: Date,
    options?: {
      limit?: number
      includeMeeting?: boolean
    }
  ) => {
    const include: Record<string, unknown> = {}
    if (options?.includeMeeting) {
      include.meeting = {
        select: {
          title: true,
        },
      }
    }

    return prisma.meetingInstance.findMany({
      where: {
        scheduledAt: {
          gte: dateAfter,
          lte: dateBefore,
        },
        OR: [
          {
            meeting: {
              participants: {
                some: {
                  personId,
                },
              },
            },
          },
          {
            participants: {
              some: {
                personId,
              },
            },
          },
        ],
        meeting: {
          organizationId,
        },
      },
      include: Object.keys(include).length > 0 ? include : undefined,
      orderBy: {
        scheduledAt: 'asc',
      },
      take: options?.limit,
    })
  }
)

export const getUpcomingNonRecurringMeetingsForPerson = cache(
  async (
    personId: string,
    organizationId: string,
    userId: string,
    dateAfter: Date,
    dateBefore: Date,
    options?: {
      limit?: number
    }
  ) => {
    return prisma.meeting.findMany({
      where: {
        isRecurring: false,
        scheduledAt: {
          gte: dateAfter,
          lte: dateBefore,
        },
        organizationId,
        OR: [
          {
            participants: {
              some: {
                personId,
              },
            },
          },
          {
            createdById: userId,
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
      take: options?.limit,
    })
  }
)
