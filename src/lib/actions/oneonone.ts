'use server'

import { prisma } from '@/lib/db'
import { oneOnOneSchema, type OneOnOneFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'

export async function createOneOnOne(formData: OneOnOneFormData) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Validate form data
  const validatedData = oneOnOneSchema.parse(formData)

  // Verify both manager and report belong to the same organization
  const [manager, report] = await Promise.all([
    prisma.person.findFirst({
      where: {
        id: validatedData.managerId,
        organizationId: user.organizationId,
      },
    }),
    prisma.person.findFirst({
      where: {
        id: validatedData.reportId,
        organizationId: user.organizationId,
      },
    }),
  ])

  if (!manager) {
    throw new Error('Manager not found or not in your organization')
  }

  if (!report) {
    throw new Error('Report not found or not in your organization')
  }

  // Create the one-on-one record
  await prisma.oneOnOne.create({
    data: {
      managerId: validatedData.managerId,
      reportId: validatedData.reportId,
      scheduledAt: new Date(validatedData.scheduledAt),
      notes: validatedData.notes,
    },
    include: {
      manager: true,
      report: true,
    },
  })

  revalidatePath('/oneonones')
  revalidatePath(`/people/${report.id}`)
  revalidatePath(`/people/${manager.id}`)

  // Redirect to the one-on-ones page
  redirect('/oneonones')
}

export async function getOneOnOnes() {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get the person record for the current user
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: user.id,
      },
    },
  })

  return await prisma.oneOnOne.findMany({
    where: {
      OR: [
        { managerId: currentPerson?.id || '' },
        { reportId: currentPerson?.id || '' },
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

  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: { user: { id: user.id } },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Get the one-on-one record, ensuring the current user is a participant
  const oneOnOne = await prisma.oneOnOne.findFirst({
    where: {
      id,
      OR: [{ managerId: currentPerson.id }, { reportId: currentPerson.id }],
    },
    include: {
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      report: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  })

  if (!oneOnOne) {
    throw new Error('One-on-one not found or you do not have access to it')
  }

  return oneOnOne
}

export async function updateOneOnOne(id: string, formData: OneOnOneFormData) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Validate form data
  const validatedData = oneOnOneSchema.parse(formData)

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: { user: { id: user.id } },
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
  })

  if (!existingOneOnOne) {
    throw new Error('One-on-one not found or you do not have access to it')
  }

  // Verify both manager and report belong to the same organization
  const [manager, report] = await Promise.all([
    prisma.person.findFirst({
      where: {
        id: validatedData.managerId,
        organizationId: user.organizationId,
      },
    }),
    prisma.person.findFirst({
      where: {
        id: validatedData.reportId,
        organizationId: user.organizationId,
      },
    }),
  ])

  if (!manager) {
    throw new Error('Manager not found or not in your organization')
  }

  if (!report) {
    throw new Error('Report not found or not in your organization')
  }

  // Update the one-on-one record
  await prisma.oneOnOne.update({
    where: { id },
    data: {
      managerId: validatedData.managerId,
      reportId: validatedData.reportId,
      scheduledAt: new Date(validatedData.scheduledAt),
      notes: validatedData.notes,
    },
  })

  // Revalidate the one-on-ones page
  revalidatePath('/oneonones')

  // Redirect to the one-on-ones page
  redirect('/oneonones')
}
