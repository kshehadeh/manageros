'use server'

import { prisma } from '@/lib/db'
import { oneOnOneSchema, type OneOnOneFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'

export async function createOneOnOne(formData: OneOnOneFormData) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Validate form data
  const validatedData = oneOnOneSchema.parse(formData)

  // Verify both participants belong to the same organization
  const [participant1, participant2] = await Promise.all([
    prisma.person.findFirst({
      where: {
        id: validatedData.participant1Id,
        organizationId: user.managerOSOrganizationId,
      },
    }),
    prisma.person.findFirst({
      where: {
        id: validatedData.participant2Id,
        organizationId: user.managerOSOrganizationId,
      },
    }),
  ])

  if (!participant1) {
    throw new Error('Participant 1 not found or not in your organization')
  }

  if (!participant2) {
    throw new Error('Participant 2 not found or not in your organization')
  }

  // Create the one-on-one record
  // Map participants to managerId and reportId for database compatibility
  const created = await prisma.oneOnOne.create({
    data: {
      managerId: validatedData.participant1Id,
      reportId: validatedData.participant2Id,
      scheduledAt: new Date(validatedData.scheduledAt),
      notes: validatedData.notes,
    },
    include: {
      manager: true,
      report: true,
    },
  })

  revalidatePath('/oneonones')
  revalidatePath(`/people/${participant1.id}`)
  revalidatePath(`/people/${participant2.id}`)

  // Return created record id to allow client-side navigation to detail page
  return { id: created.id }
}

export async function getOneOnOnes() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get the person ID from the user session
  if (!user.managerOSPersonId) {
    throw new Error('No person record found for current user')
  }

  const currentPerson = await prisma.person.findUnique({
    where: {
      id: user.managerOSPersonId || '',
    },
  })

  return await prisma.oneOnOne.findMany({
    where: {
      OR: [
        { managerId: currentPerson?.id || '' }, // participant1
        { reportId: currentPerson?.id || '' }, // participant2
      ],
      // Ensure both manager and report belong to the current organization
      AND: [
        { manager: { organizationId: user.managerOSOrganizationId } },
        { report: { organizationId: user.managerOSOrganizationId } },
      ],
    },
    include: {
      manager: true,
      report: true,
    },
    orderBy: { scheduledAt: 'desc' },
  })
}

export async function getOneOnOneById(id: string) {
  const user = await getCurrentUser()

  const hasPermission = await getActionPermission(user, 'oneonone.view', id)

  if (!hasPermission) {
    throw new Error('You do not have permission to view this one-on-one')
  }

  const oneOnOne = await prisma.oneOnOne.findFirst({
    where: {
      id,
    },
    include: {
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
        },
      },
      report: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
        },
      },
    },
  })

  return oneOnOne
}

export async function updateOneOnOne(id: string, formData: OneOnOneFormData) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Validate form data
  const validatedData = oneOnOneSchema.parse(formData)

  // Get the current user's person ID from session
  if (!user.managerOSPersonId) {
    throw new Error('No person record found for current user')
  }

  const currentPerson = await prisma.person.findUnique({
    where: { id: user.managerOSPersonId },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Verify the one-on-one exists and user has access to it
  const existingOneOnOne = await prisma.oneOnOne.findFirst({
    where: {
      id,
      OR: [{ managerId: currentPerson.id }, { reportId: currentPerson.id }], // participant1 or participant2
    },
  })

  if (!existingOneOnOne) {
    throw new Error('One-on-one not found or you do not have access to it')
  }

  // Verify both participants belong to the same organization
  const [participant1, participant2] = await Promise.all([
    prisma.person.findFirst({
      where: {
        id: validatedData.participant1Id,
        organizationId: user.managerOSOrganizationId,
      },
    }),
    prisma.person.findFirst({
      where: {
        id: validatedData.participant2Id,
        organizationId: user.managerOSOrganizationId,
      },
    }),
  ])

  if (!participant1) {
    throw new Error('Participant 1 not found or not in your organization')
  }

  if (!participant2) {
    throw new Error('Participant 2 not found or not in your organization')
  }

  // Update the one-on-one record
  // Map participants to managerId and reportId for database compatibility
  await prisma.oneOnOne.update({
    where: { id },
    data: {
      managerId: validatedData.participant1Id,
      reportId: validatedData.participant2Id,
      scheduledAt: new Date(validatedData.scheduledAt),
      notes: validatedData.notes,
    },
  })

  // Revalidate the one-on-ones page
  revalidatePath('/oneonones')

  // Redirect to the one-on-ones page
  redirect('/oneonones')
}

export async function deleteOneOnOne(id: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get the current user's person ID from session
  if (!user.managerOSPersonId) {
    throw new Error('No person record found for current user')
  }

  const currentPerson = await prisma.person.findUnique({
    where: { id: user.managerOSPersonId },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Verify the one-on-one exists and user has access to it
  const existingOneOnOne = await prisma.oneOnOne.findFirst({
    where: {
      id,
      OR: [{ managerId: currentPerson.id }, { reportId: currentPerson.id }],
    },
    include: {
      manager: true,
      report: true,
    },
  })

  if (!existingOneOnOne) {
    throw new Error('One-on-one not found or you do not have access to it')
  }

  // Delete the one-on-one
  await prisma.oneOnOne.delete({
    where: { id },
  })

  // Revalidate relevant pages
  revalidatePath('/oneonones')
  revalidatePath(`/people/${existingOneOnOne.manager.id}`)
  revalidatePath(`/people/${existingOneOnOne.report.id}`)
}
