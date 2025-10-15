import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export const meetingsTool = {
  description:
    'Get information about meetings in the organization. Use the most recent instance notes to get the notes of the meeting if it has instances otherwise use the notes in the main meeting record. Use this to find what meetings someone attended or organized.',
  parameters: z.object({
    ownerId: z
      .string()
      .optional()
      .describe(
        'Filter by meeting owner ID but do not use this unless the prompt is asking for specifically meetings where the user was the owner. Owner is tied to the person ID of the user'
      ),
    participantId: z
      .string()
      .optional()
      .describe(
        'Filter by participant ID but do not use this unless the prompt is asking for specifically meetings where the user was a participant. Participant is tied to the person ID of the user'
      ),
    query: z
      .string()
      .optional()
      .describe(
        'Search query to filter meetings by title or description or notes'
      ),
    scheduledAfter: z
      .string()
      .optional()
      .describe(
        'ISO date string - only show meetings scheduled after this date'
      ),
    scheduledBefore: z
      .string()
      .optional()
      .describe(
        'ISO date string - only show meetings scheduled before this date'
      ),
    createdAfter: z
      .string()
      .optional()
      .describe('ISO date string - only show meetings created after this date'),
    createdBefore: z
      .string()
      .optional()
      .describe(
        'ISO date string - only show meetings created before this date'
      ),
  }),
  execute: async ({
    ownerId,
    participantId,
    query,
    scheduledAfter,
    scheduledBefore,
    createdAfter,
    createdBefore,
  }: {
    ownerId?: string
    participantId?: string
    query?: string
    scheduledAfter?: string
    scheduledBefore?: string
    createdAfter?: string
    createdBefore?: string
  }) => {
    console.log(
      'meetingsTool',
      ownerId,
      participantId,
      query,
      scheduledAfter,
      scheduledBefore,
      createdAfter,
      createdBefore
    )
    const user = await getCurrentUser()
    if (!user.organizationId) {
      throw new Error('User must belong to an organization')
    }

    // Get the current user's person record (may be null if not linked)
    const currentPerson = await prisma.person.findFirst({
      where: {
        user: {
          id: user.id,
        },
      },
    })

    // Build access control for privacy
    const accessControlOr: Prisma.MeetingWhereInput[] = [
      { isPrivate: false }, // Public meetings
      { createdById: user.id }, // Private meetings created by current user
    ]

    if (currentPerson) {
      accessControlOr.push(
        { ownerId: currentPerson.id }, // Private meetings where user is the owner
        {
          participants: {
            some: {
              personId: currentPerson.id,
            },
          },
        } // Private meetings where user is a participant
      )
    }

    const whereClause: Prisma.MeetingWhereInput = {
      organizationId: user.organizationId,
      OR: accessControlOr,
    }

    if (ownerId) whereClause.ownerId = ownerId

    // Date filters for scheduled meetings
    if (scheduledAfter || scheduledBefore) {
      whereClause.scheduledAt = {}
      if (scheduledAfter) {
        whereClause.scheduledAt.gte = new Date(scheduledAfter)
      }
      if (scheduledBefore) {
        whereClause.scheduledAt.lte = new Date(scheduledBefore)
      }
    }

    // Date filters for created meetings
    if (createdAfter || createdBefore) {
      whereClause.createdAt = {}
      if (createdAfter) {
        whereClause.createdAt.gte = new Date(createdAfter)
      }
      if (createdBefore) {
        whereClause.createdAt.lte = new Date(createdBefore)
      }
    }

    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { notes: { contains: query, mode: 'insensitive' } },
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
            notes: true,
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
        notes: meeting.notes,
        owner: meeting.owner?.name,
        participants: meeting.participants.map(p => p.person.name),
        instancesCount: meeting._count.instances,
        participantsCount: meeting._count.participants,
        lastInstance: meeting.instances[0]
          ? {
              scheduledAt: meeting.instances[0].scheduledAt,
              notes: meeting.instances[0].notes,
            }
          : null,
      })),
    }
  },
}
