'use server'

import { prisma } from '@/lib/db'
import {
  meetingSchema,
  meetingUpdateSchema,
  type MeetingFormData,
  type MeetingUpdateData,
} from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth-utils'

export async function createMeeting(formData: MeetingFormData) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to create meetings')
  }

  // Validate the form data
  const validatedData = meetingSchema.parse(formData)

  // Parse scheduled date
  const scheduledAt = new Date(validatedData.scheduledAt)

  // Verify team belongs to user's organization if specified
  if (validatedData.teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: validatedData.teamId,
        organizationId: user.organizationId,
      },
    })
    if (!team) {
      throw new Error('Team not found or access denied')
    }
  }

  // Verify initiative belongs to user's organization if specified
  if (validatedData.initiativeId) {
    const initiative = await prisma.initiative.findFirst({
      where: {
        id: validatedData.initiativeId,
        organizationId: user.organizationId,
      },
    })
    if (!initiative) {
      throw new Error('Initiative not found or access denied')
    }
  }

  // Verify owner belongs to user's organization if specified
  if (validatedData.ownerId) {
    const owner = await prisma.person.findFirst({
      where: {
        id: validatedData.ownerId,
        organizationId: user.organizationId,
      },
    })
    if (!owner) {
      throw new Error('Owner not found or access denied')
    }
  }

  // Verify all participants belong to user's organization
  if (validatedData.participants && validatedData.participants.length > 0) {
    const participantIds = validatedData.participants.map(p => p.personId)
    const participants = await prisma.person.findMany({
      where: {
        id: { in: participantIds },
        organizationId: user.organizationId,
      },
    })
    if (participants.length !== participantIds.length) {
      throw new Error('One or more participants not found or access denied')
    }
  }

  // Create the meeting
  const meeting = await prisma.meeting.create({
    data: {
      title: validatedData.title,
      description: validatedData.description,
      scheduledAt,
      duration: validatedData.duration,
      location: validatedData.location,
      notes: validatedData.notes,
      isRecurring: validatedData.isRecurring,
      recurrenceType: validatedData.recurrenceType,
      organizationId: user.organizationId,
      teamId: validatedData.teamId,
      initiativeId: validatedData.initiativeId,
      ownerId: validatedData.ownerId,
      createdById: user.id,
      participants: {
        create: validatedData.participants.map(participant => ({
          personId: participant.personId,
          status: participant.status,
        })),
      },
    },
    include: {
      organization: true,
      team: true,
      initiative: true,
      owner: true,
      createdBy: true,
      participants: {
        include: {
          person: true,
        },
      },
      instances: {
        include: {
          participants: {
            include: {
              person: true,
            },
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      },
    },
  })

  revalidatePath('/meetings')
  return meeting
}

export async function updateMeeting(id: string, formData: MeetingUpdateData) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to update meetings')
  }

  // Validate the form data
  const validatedData = meetingUpdateSchema.parse(formData)

  // Check if meeting exists and belongs to user's organization
  const existingMeeting = await prisma.meeting.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
    },
  })

  if (!existingMeeting) {
    throw new Error('Meeting not found or access denied')
  }

  // Parse scheduled date if provided
  const scheduledAt = validatedData.scheduledAt
    ? new Date(validatedData.scheduledAt)
    : undefined

  // Verify team belongs to user's organization if specified
  if (validatedData.teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: validatedData.teamId,
        organizationId: user.organizationId,
      },
    })
    if (!team) {
      throw new Error('Team not found or access denied')
    }
  }

  // Verify initiative belongs to user's organization if specified
  if (validatedData.initiativeId) {
    const initiative = await prisma.initiative.findFirst({
      where: {
        id: validatedData.initiativeId,
        organizationId: user.organizationId,
      },
    })
    if (!initiative) {
      throw new Error('Initiative not found or access denied')
    }
  }

  // Verify owner belongs to user's organization if specified
  if (validatedData.ownerId) {
    const owner = await prisma.person.findFirst({
      where: {
        id: validatedData.ownerId,
        organizationId: user.organizationId,
      },
    })
    if (!owner) {
      throw new Error('Owner not found or access denied')
    }
  }

  // Update the meeting
  const meeting = await prisma.meeting.update({
    where: { id },
    data: {
      title: validatedData.title,
      description: validatedData.description,
      scheduledAt,
      duration: validatedData.duration,
      location: validatedData.location,
      notes: validatedData.notes,
      isRecurring: validatedData.isRecurring,
      recurrenceType: validatedData.recurrenceType,
      teamId: validatedData.teamId,
      initiativeId: validatedData.initiativeId,
      ownerId: validatedData.ownerId,
    },
    include: {
      organization: true,
      team: true,
      initiative: true,
      owner: true,
      createdBy: true,
      participants: {
        include: {
          person: true,
        },
      },
      instances: {
        include: {
          participants: {
            include: {
              person: true,
            },
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      },
    },
  })

  revalidatePath('/meetings')
  revalidatePath(`/meetings/${id}`)
  return meeting
}

export async function deleteMeeting(id: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to delete meetings')
  }

  // Check if meeting exists and belongs to user's organization
  const meeting = await prisma.meeting.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
    },
  })

  if (!meeting) {
    throw new Error('Meeting not found or access denied')
  }

  // Delete the meeting (participants will be deleted due to cascade)
  await prisma.meeting.delete({
    where: { id },
  })

  revalidatePath('/meetings')
}

export async function getMeetings() {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view meetings')
  }

  const meetings = await prisma.meeting.findMany({
    where: {
      organizationId: user.organizationId,
    },
    include: {
      organization: true,
      team: true,
      initiative: true,
      owner: true,
      createdBy: true,
      participants: {
        include: {
          person: true,
        },
      },
      instances: {
        include: {
          participants: {
            include: {
              person: true,
            },
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      },
    },
    orderBy: {
      scheduledAt: 'asc',
    },
  })

  return meetings
}

export async function getMeeting(id: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view meetings')
  }

  const meeting = await prisma.meeting.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
    },
    include: {
      organization: true,
      team: true,
      initiative: true,
      owner: true,
      createdBy: true,
      participants: {
        include: {
          person: true,
        },
      },
      instances: {
        include: {
          participants: {
            include: {
              person: true,
            },
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      },
    },
  })

  if (!meeting) {
    throw new Error('Meeting not found or access denied')
  }

  return meeting
}

export async function addMeetingParticipant(
  meetingId: string,
  personId: string,
  status: string = 'invited'
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error(
      'User must belong to an organization to manage meeting participants'
    )
  }

  // Check if meeting exists and belongs to user's organization
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: meetingId,
      organizationId: user.organizationId,
    },
  })

  if (!meeting) {
    throw new Error('Meeting not found or access denied')
  }

  // Check if person belongs to user's organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: user.organizationId,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  // Check if participant already exists
  const existingParticipant = await prisma.meetingParticipant.findUnique({
    where: {
      // eslint-disable-next-line camelcase
      meetingId_personId: {
        meetingId,
        personId,
      },
    },
  })

  if (existingParticipant) {
    throw new Error('Person is already a participant in this meeting')
  }

  // Add the participant
  const participant = await prisma.meetingParticipant.create({
    data: {
      meetingId,
      personId,
      status,
    },
    include: {
      person: true,
    },
  })

  revalidatePath('/meetings')
  revalidatePath(`/meetings/${meetingId}`)
  return participant
}

export async function updateMeetingParticipantStatus(
  meetingId: string,
  personId: string,
  status: string
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error(
      'User must belong to an organization to manage meeting participants'
    )
  }

  // Check if meeting exists and belongs to user's organization
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: meetingId,
      organizationId: user.organizationId,
    },
  })

  if (!meeting) {
    throw new Error('Meeting not found or access denied')
  }

  // Update the participant status
  const participant = await prisma.meetingParticipant.update({
    where: {
      // eslint-disable-next-line camelcase
      meetingId_personId: {
        meetingId,
        personId,
      },
    },
    data: {
      status,
    },
    include: {
      person: true,
    },
  })

  revalidatePath('/meetings')
  revalidatePath(`/meetings/${meetingId}`)
  return participant
}

export async function removeMeetingParticipant(
  meetingId: string,
  personId: string
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error(
      'User must belong to an organization to manage meeting participants'
    )
  }

  // Check if meeting exists and belongs to user's organization
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: meetingId,
      organizationId: user.organizationId,
    },
  })

  if (!meeting) {
    throw new Error('Meeting not found or access denied')
  }

  // Remove the participant
  await prisma.meetingParticipant.delete({
    where: {
      // eslint-disable-next-line camelcase
      meetingId_personId: {
        meetingId,
        personId,
      },
    },
  })

  revalidatePath('/meetings')
  revalidatePath(`/meetings/${meetingId}`)
}
