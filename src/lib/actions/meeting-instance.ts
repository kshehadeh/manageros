'use server'

import { prisma } from '@/lib/db'
import {
  meetingInstanceSchema,
  meetingInstanceUpdateSchema,
  type MeetingInstanceFormData,
  type MeetingInstanceUpdateData,
} from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'

export async function createMeetingInstance(formData: MeetingInstanceFormData) {
  const user = await getCurrentUser()

  // Check permission to create meeting instances
  const hasPermission = await getActionPermission(
    user,
    'meeting-instance.create'
  )

  if (!hasPermission || !user.managerOSOrganizationId) {
    throw new Error('You do not have permission to create meeting instances')
  }

  // Validate the form data
  const validatedData = meetingInstanceSchema.parse(formData)

  // Parse scheduled date
  const scheduledAt = new Date(validatedData.scheduledAt)

  // Check if meeting exists and belongs to user's organization
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: validatedData.meetingId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!meeting) {
    throw new Error('Meeting not found or access denied')
  }

  // Verify all participants belong to user's organization
  if (validatedData.participants && validatedData.participants.length > 0) {
    const participantIds = validatedData.participants.map(p => p.personId)
    const participants = await prisma.person.findMany({
      where: {
        id: { in: participantIds },
        organizationId: user.managerOSOrganizationId,
      },
    })
    if (participants.length !== participantIds.length) {
      throw new Error('One or more participants not found or access denied')
    }
  }

  // Create the meeting instance
  const meetingInstance = await prisma.meetingInstance.create({
    data: {
      meetingId: validatedData.meetingId,
      scheduledAt,
      notes: validatedData.notes,
      isPrivate: meeting.isPrivate, // Inherit privacy from parent meeting
      organizationId: user.managerOSOrganizationId,
      participants: {
        create: validatedData.participants.map(participant => ({
          personId: participant.personId,
          status: participant.status,
        })),
      },
    },
    include: {
      meeting: {
        include: {
          team: true,
          initiative: true,
          owner: true,
        },
      },
      participants: {
        include: {
          person: true,
        },
      },
    },
  })

  revalidatePath('/meetings')
  revalidatePath(`/meetings/${validatedData.meetingId}`)
  return meetingInstance
}

export async function updateMeetingInstance(
  id: string,
  formData: MeetingInstanceUpdateData
) {
  const user = await getCurrentUser()

  // Check permission to edit this meeting instance
  const hasPermission = await getActionPermission(
    user,
    'meeting-instance.edit',
    id
  )

  if (!hasPermission || !user.managerOSOrganizationId) {
    throw new Error('You do not have permission to edit this meeting instance')
  }

  // Validate the form data
  const validatedData = meetingInstanceUpdateSchema.parse(formData)

  // Check if meeting instance exists and belongs to user's organization
  const existingInstance = await prisma.meetingInstance.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!existingInstance) {
    throw new Error('Meeting instance not found or access denied')
  }

  // Parse scheduled date if provided
  const scheduledAt = validatedData.scheduledAt
    ? new Date(validatedData.scheduledAt)
    : undefined

  // Verify all participants belong to user's organization if participants are being updated
  if (validatedData.participants && validatedData.participants.length > 0) {
    const participantIds = validatedData.participants.map(p => p.personId)
    const participants = await prisma.person.findMany({
      where: {
        id: { in: participantIds },
        organizationId: user.managerOSOrganizationId,
      },
    })
    if (participants.length !== participantIds.length) {
      throw new Error('One or more participants not found or access denied')
    }
  }

  // Update the meeting instance
  const meetingInstance = await prisma.meetingInstance.update({
    where: { id },
    data: {
      scheduledAt,
      notes: validatedData.notes,
      // Update participants if provided
      ...(validatedData.participants && {
        participants: {
          deleteMany: {}, // Remove all existing participants
          create: validatedData.participants.map(participant => ({
            personId: participant.personId,
            status: participant.status,
          })),
        },
      }),
    },
    include: {
      meeting: {
        include: {
          team: true,
          initiative: true,
          owner: true,
        },
      },
      participants: {
        include: {
          person: true,
        },
      },
    },
  })

  revalidatePath('/meetings')
  revalidatePath(`/meetings/${meetingInstance.meetingId}`)
  return meetingInstance
}

export async function deleteMeetingInstance(id: string) {
  const user = await getCurrentUser()

  // Check permission to delete this meeting instance
  const hasPermission = await getActionPermission(
    user,
    'meeting-instance.delete',
    id
  )

  if (!hasPermission || !user.managerOSOrganizationId) {
    throw new Error(
      'You do not have permission to delete this meeting instance'
    )
  }

  // Get meeting instance to find meetingId for revalidation
  const meetingInstance = await prisma.meetingInstance.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!meetingInstance) {
    throw new Error('Meeting instance not found or access denied')
  }

  // Delete the meeting instance (participants will be deleted due to cascade)
  await prisma.meetingInstance.delete({
    where: { id },
  })

  revalidatePath('/meetings')
  revalidatePath(`/meetings/${meetingInstance.meetingId}`)
}

export async function getMeetingInstance(id: string) {
  const user = await getCurrentUser()

  const hasPermission = await getActionPermission(
    user,
    'meeting-instance.view',
    id
  )

  if (!hasPermission) {
    throw new Error('You do not have permission to view this meeting instance')
  }

  const meetingInstance = await prisma.meetingInstance.findFirst({
    where: {
      id,
    },
    include: {
      meeting: {
        include: {
          team: true,
          initiative: true,
          owner: true,
          createdBy: true,
        },
      },
      participants: {
        include: {
          person: true,
        },
      },
    },
  })

  return meetingInstance
}

export async function getMeetingInstances(meetingId: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to view meeting instances'
    )
  }

  // Get the current user's person record (may be null if not linked)
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: user.managerOSUserId || '',
      },
    },
  })

  // Check if meeting exists and belongs to user's organization
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: meetingId,
      organizationId: user.managerOSOrganizationId,
      OR: [
        { isPrivate: false }, // Public meetings
        { createdById: user.managerOSUserId || '' }, // Private meetings created by current user
        ...(currentPerson
          ? [
              {
                participants: {
                  some: {
                    personId: currentPerson.id,
                  },
                },
              } as const,
            ]
          : []),
      ],
    },
  })

  if (!meeting) {
    throw new Error('Meeting not found or access denied')
  }

  const meetingInstances = await prisma.meetingInstance.findMany({
    where: {
      meetingId,
      organizationId: user.managerOSOrganizationId,
    },
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
  })

  return meetingInstances
}

export async function addMeetingInstanceParticipant(
  meetingInstanceId: string,
  personId: string,
  status: string = 'invited'
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to manage meeting instance participants'
    )
  }

  // Check if meeting instance exists and belongs to user's organization
  const meetingInstance = await prisma.meetingInstance.findFirst({
    where: {
      id: meetingInstanceId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!meetingInstance) {
    throw new Error('Meeting instance not found or access denied')
  }

  // Check if person belongs to user's organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  // Check if participant already exists
  const existingParticipant =
    await prisma.meetingInstanceParticipant.findUnique({
      where: {
        // eslint-disable-next-line camelcase
        meetingInstanceId_personId: {
          meetingInstanceId,
          personId,
        },
      },
    })

  if (existingParticipant) {
    throw new Error('Person is already a participant in this meeting instance')
  }

  // Add the participant
  const participant = await prisma.meetingInstanceParticipant.create({
    data: {
      meetingInstanceId,
      personId,
      status,
    },
    include: {
      person: true,
    },
  })

  revalidatePath('/meetings')
  revalidatePath(`/meetings/${meetingInstance.meetingId}`)
  return participant
}

export async function updateMeetingInstanceParticipantStatus(
  meetingInstanceId: string,
  personId: string,
  status: string
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to manage meeting instance participants'
    )
  }

  // Check if meeting instance exists and belongs to user's organization
  const meetingInstance = await prisma.meetingInstance.findFirst({
    where: {
      id: meetingInstanceId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!meetingInstance) {
    throw new Error('Meeting instance not found or access denied')
  }

  // Update the participant status
  const participant = await prisma.meetingInstanceParticipant.update({
    where: {
      // eslint-disable-next-line camelcase
      meetingInstanceId_personId: {
        meetingInstanceId,
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
  revalidatePath(`/meetings/${meetingInstance.meetingId}`)
  return participant
}

export async function removeMeetingInstanceParticipant(
  meetingInstanceId: string,
  personId: string
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to manage meeting instance participants'
    )
  }

  // Check if meeting instance exists and belongs to user's organization
  const meetingInstance = await prisma.meetingInstance.findFirst({
    where: {
      id: meetingInstanceId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!meetingInstance) {
    throw new Error('Meeting instance not found or access denied')
  }

  // Remove the participant
  await prisma.meetingInstanceParticipant.delete({
    where: {
      // eslint-disable-next-line camelcase
      meetingInstanceId_personId: {
        meetingInstanceId,
        personId,
      },
    },
  })

  revalidatePath('/meetings')
  revalidatePath(`/meetings/${meetingInstance.meetingId}`)
}

export interface ImportedMeetingInstanceData {
  scheduledAt: string // ISO string format
  notes?: string
  participants: Array<{
    personId: string
    status:
      | 'invited'
      | 'accepted'
      | 'declined'
      | 'tentative'
      | 'attended'
      | 'absent'
  }>
}

/**
 * Import and parse an ICS file for a meeting instance
 * This must be a server action because node-ical uses Node.js APIs
 */
export async function importMeetingInstanceFromICS(
  fileContent: string
): Promise<ImportedMeetingInstanceData> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to import meeting instances'
    )
  }

  // Import parseICSFile dynamically only on server
  const { parseICSFile } = await import('@/lib/utils/ics-parser')

  // Parse the ICS file
  const parsedData = await parseICSFile(fileContent)

  // Import matchAttendeesToPeople from meeting actions
  const { matchAttendeesToPeople } = await import('@/lib/actions/meeting')

  // Match attendees to people in the organization
  const matchedAttendees = await matchAttendeesToPeople(
    parsedData.attendeeEmails,
    parsedData.organizerEmail
  )

  return {
    scheduledAt: parsedData.scheduledAt,
    notes: parsedData.description,
    participants: matchedAttendees.participants,
  }
}
