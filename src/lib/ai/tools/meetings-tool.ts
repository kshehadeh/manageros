import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export const meetingsTool = {
  description: 'Get information about meetings in the organization',
  parameters: z.object({
    ownerId: z.string().optional().describe('Filter by meeting owner ID'),
    participantId: z.string().optional().describe('Filter by participant ID'),
    query: z
      .string()
      .optional()
      .describe('Search query to filter meetings by title or description'),
  }),
  execute: async ({
    ownerId,
    participantId,
    query,
  }: {
    ownerId?: string
    participantId?: string
    query?: string
  }) => {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      throw new Error('User must belong to an organization')
    }

    const whereClause: Prisma.MeetingWhereInput = {
      organizationId: user.organizationId,
    }

    if (ownerId) whereClause.ownerId = ownerId
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    }

    const meetings = await prisma.meeting.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          include: {
            person: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        instances: {
          select: {
            id: true,
            scheduledAt: true,
          },
          orderBy: { scheduledAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            instances: true,
            participants: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Filter by participant if specified
    let filteredMeetings = meetings
    if (participantId) {
      filteredMeetings = meetings.filter(meeting =>
        meeting.participants.some(p => p.personId === participantId)
      )
    }

    return {
      meetings: filteredMeetings.map(meeting => ({
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        owner: meeting.owner?.name,
        participants: meeting.participants.map(p => p.person.name),
        instancesCount: meeting._count.instances,
        participantsCount: meeting._count.participants,
        lastInstance: meeting.instances[0]
          ? {
              scheduledAt: meeting.instances[0].scheduledAt,
            }
          : null,
      })),
    }
  },
}
