'use server'

import { prisma } from '@/lib/db'
import { feedbackSchema, type FeedbackFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'

export async function createFeedback(formData: FeedbackFormData) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to create feedback')
  }

  // Validate the form data
  const validatedData = feedbackSchema.parse(formData)

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      id: user.managerOSPersonId || '',
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Verify the person being given feedback belongs to the same organization
  const aboutPerson = await prisma.person.findFirst({
    where: {
      id: validatedData.aboutId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!aboutPerson) {
    throw new Error('Person not found or access denied')
  }

  // Create the feedback
  const feedback = await prisma.feedback.create({
    data: {
      aboutId: validatedData.aboutId,
      fromId: currentPerson.id,
      kind: validatedData.kind,
      isPrivate: validatedData.isPrivate,
      body: validatedData.body,
    },
    include: {
      about: {
        select: {
          id: true,
          name: true,
        },
      },
      from: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  revalidatePath(`/people/${validatedData.aboutId}`)
  return feedback
}

export async function updateFeedback(id: string, formData: FeedbackFormData) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update feedback')
  }

  // Validate the form data
  const validatedData = feedbackSchema.parse(formData)

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      id: user.managerOSPersonId || '',
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Verify the feedback exists, the current user is the author,
  // and the "about" person belongs to the user's organization
  const existingFeedback = await prisma.feedback.findFirst({
    where: {
      id,
      fromId: currentPerson.id,
      about: {
        organizationId: user.managerOSOrganizationId,
      },
    },
  })

  if (!existingFeedback) {
    throw new Error(
      'Feedback not found or you do not have permission to edit it'
    )
  }

  // Verify the NEW person being given feedback belongs to the same organization
  const aboutPerson = await prisma.person.findFirst({
    where: {
      id: validatedData.aboutId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!aboutPerson) {
    throw new Error('Person not found or access denied')
  }

  // Update the feedback
  const feedback = await prisma.feedback.update({
    where: { id },
    data: {
      aboutId: validatedData.aboutId,
      kind: validatedData.kind,
      isPrivate: validatedData.isPrivate,
      body: validatedData.body,
    },
    include: {
      about: {
        select: {
          id: true,
          name: true,
        },
      },
      from: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  revalidatePath(`/people/${validatedData.aboutId}`)
  return feedback
}

export async function deleteFeedback(id: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to delete feedback')
  }

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      id: user.managerOSPersonId || '',
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Verify the feedback exists, the current user is the author,
  // and the "about" person belongs to the user's organization
  const existingFeedback = await prisma.feedback.findFirst({
    where: {
      id,
      fromId: currentPerson.id,
      about: {
        organizationId: user.managerOSOrganizationId,
      },
    },
  })

  if (!existingFeedback) {
    throw new Error(
      'Feedback not found or you do not have permission to delete it'
    )
  }

  // Delete the feedback
  await prisma.feedback.delete({
    where: { id },
  })

  revalidatePath(`/people/${existingFeedback.aboutId}`)
}

export async function getFeedbackForPerson(personId: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to view feedback')
  }

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      id: user.managerOSPersonId || '',
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Verify the person belongs to the same organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  // Get feedback for the person
  // Only show feedback that is either:
  // 1. Not private (public feedback)
  // 2. Private feedback written by the current user
  const feedback = await prisma.feedback.findMany({
    where: {
      aboutId: personId,
      OR: [{ isPrivate: false }, { fromId: currentPerson.id }],
    },
    include: {
      about: {
        select: {
          id: true,
          name: true,
        },
      },
      from: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return feedback
}

export async function getFeedbackById(id: string) {
  const user = await getCurrentUser()

  const hasPermission = await getActionPermission(user, 'feedback.view', id)

  if (!hasPermission) {
    throw new Error('You do not have permission to view this feedback')
  }

  // Filter by organizationId to ensure organization isolation
  // The permission check already validates access, but we add this for defense in depth
  const feedback = await prisma.feedback.findFirst({
    where: {
      id,
      about: {
        organizationId: user.managerOSOrganizationId || '',
      },
    },
    include: {
      about: {
        select: {
          id: true,
          name: true,
        },
      },
      from: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return feedback
}
