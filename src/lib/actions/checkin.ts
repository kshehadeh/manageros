'use server'

import { prisma } from '@/lib/db'
import { checkInSchema, type CheckInFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth-utils'

export async function createCheckIn(formData: CheckInFormData) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to create check-ins')
  }

  // Validate the form data
  const validatedData = checkInSchema.parse(formData)

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      id: user.managerOSPersonId || '',
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Verify initiative belongs to user's organization
  const initiative = await prisma.initiative.findFirst({
    where: {
      id: validatedData.initiativeId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!initiative) {
    throw new Error('Initiative not found or access denied')
  }

  // Parse the weekOf date
  const weekOf = new Date(validatedData.weekOf)

  // Create the check-in
  const checkIn = await prisma.checkIn.create({
    data: {
      initiativeId: validatedData.initiativeId,
      weekOf,
      rag: validatedData.rag,
      confidence: validatedData.confidence,
      summary: validatedData.summary,
      blockers: validatedData.blockers,
      nextSteps: validatedData.nextSteps,
      createdById: currentPerson.id,
    },
    include: {
      initiative: true,
      createdBy: true,
    },
  })

  // Revalidate the initiative detail page
  revalidatePath(`/initiatives/${validatedData.initiativeId}`)

  return checkIn
}

export async function updateCheckIn(
  checkInId: string,
  formData: CheckInFormData
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update check-ins')
  }

  // Validate the form data
  const validatedData = checkInSchema.parse(formData)

  // Verify check-in belongs to user's organization
  const existingCheckIn = await prisma.checkIn.findFirst({
    where: {
      id: checkInId,
      initiative: {
        organizationId: user.managerOSOrganizationId,
      },
    },
  })

  if (!existingCheckIn) {
    throw new Error('Check-in not found or access denied')
  }

  // Parse the weekOf date
  const weekOf = new Date(validatedData.weekOf)

  // Update the check-in
  const checkIn = await prisma.checkIn.update({
    where: { id: checkInId },
    data: {
      weekOf,
      rag: validatedData.rag,
      confidence: validatedData.confidence,
      summary: validatedData.summary,
      blockers: validatedData.blockers,
      nextSteps: validatedData.nextSteps,
    },
    include: {
      initiative: true,
      createdBy: true,
    },
  })

  // Revalidate the initiative detail page
  revalidatePath(`/initiatives/${validatedData.initiativeId}`)

  return checkIn
}

export async function deleteCheckIn(checkInId: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to delete check-ins')
  }

  // Verify check-in belongs to user's organization
  const existingCheckIn = await prisma.checkIn.findFirst({
    where: {
      id: checkInId,
      initiative: {
        organizationId: user.managerOSOrganizationId,
      },
    },
    include: {
      initiative: true,
    },
  })

  if (!existingCheckIn) {
    throw new Error('Check-in not found or access denied')
  }

  // Delete the check-in
  await prisma.checkIn.delete({
    where: { id: checkInId },
  })

  // Revalidate the initiative detail page
  revalidatePath(`/initiatives/${existingCheckIn.initiativeId}`)

  return { success: true }
}

export async function getCheckIn(checkInId: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to view check-ins')
  }

  // Get the check-in with initiative details
  const checkIn = await prisma.checkIn.findFirst({
    where: {
      id: checkInId,
      initiative: {
        organizationId: user.managerOSOrganizationId,
      },
    },
    include: {
      initiative: true,
      createdBy: true,
    },
  })

  if (!checkIn) {
    throw new Error('Check-in not found or access denied')
  }

  return checkIn
}
