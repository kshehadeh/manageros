'use server'

import { prisma } from '@/lib/db'
import { initiativeSchema, type InitiativeFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'

export async function createInitiative(formData: InitiativeFormData) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to create initiatives')
  }

  // Validate the form data
  const validatedData = initiativeSchema.parse(formData)

  // Parse dates if provided
  const startDate = validatedData.startDate
    ? new Date(validatedData.startDate)
    : null
  const targetDate = validatedData.targetDate
    ? new Date(validatedData.targetDate)
    : null

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

  // Create the initiative with objectives and owners
  const initiative = await prisma.initiative.create({
    data: {
      title: validatedData.title,
      summary: validatedData.summary,
      outcome: validatedData.outcome,
      startDate,
      targetDate,
      status: validatedData.status,
      rag: validatedData.rag,
      confidence: validatedData.confidence,
      teamId: validatedData.teamId,
      organizationId: user.organizationId,
      objectives: {
        create:
          validatedData.objectives?.map((obj, index) => ({
            title: obj.title,
            keyResult: obj.keyResult,
            sortIndex: index,
          })) || [],
      },
      owners: {
        create:
          validatedData.owners?.map(owner => ({
            personId: owner.personId,
            role: owner.role,
          })) || [],
      },
    },
    include: {
      objectives: true,
      owners: {
        include: {
          person: true,
        },
      },
      team: true,
    },
  })

  // Revalidate the initiatives page
  revalidatePath('/initiatives')

  // Redirect to the new initiative
  redirect(`/initiatives/${initiative.id}`)
}

export async function updateInitiative(
  id: string,
  formData: InitiativeFormData
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to update initiatives')
  }

  // Validate the form data
  const validatedData = initiativeSchema.parse(formData)

  // Parse dates if provided
  const startDate = validatedData.startDate
    ? new Date(validatedData.startDate)
    : null
  const targetDate = validatedData.targetDate
    ? new Date(validatedData.targetDate)
    : null

  // Verify initiative belongs to user's organization
  const existingInitiative = await prisma.initiative.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
    },
  })
  if (!existingInitiative) {
    throw new Error('Initiative not found or access denied')
  }

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

  // Update the initiative with objectives and owners
  const initiative = await prisma.initiative.update({
    where: { id },
    data: {
      title: validatedData.title,
      summary: validatedData.summary,
      outcome: validatedData.outcome,
      startDate,
      targetDate,
      status: validatedData.status,
      rag: validatedData.rag,
      confidence: validatedData.confidence,
      teamId: validatedData.teamId,
      // Update objectives by deleting existing and creating new ones
      objectives: {
        deleteMany: {},
        create:
          validatedData.objectives?.map((obj, index) => ({
            title: obj.title,
            keyResult: obj.keyResult,
            sortIndex: index,
          })) || [],
      },
      // Update owners by deleting existing and creating new ones
      owners: {
        deleteMany: {},
        create:
          validatedData.owners?.map(owner => ({
            personId: owner.personId,
            role: owner.role,
          })) || [],
      },
    },
    include: {
      objectives: true,
      owners: {
        include: {
          person: true,
        },
      },
      team: true,
    },
  })

  // Revalidate the initiatives page
  revalidatePath('/initiatives')
  revalidatePath(`/initiatives/${id}`)

  // Redirect to the updated initiative
  redirect(`/initiatives/${initiative.id}`)
}

export async function deleteInitiative(id: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to delete initiatives')
  }

  // Verify initiative belongs to user's organization
  const existingInitiative = await prisma.initiative.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
    },
  })
  if (!existingInitiative) {
    throw new Error('Initiative not found or access denied')
  }

  // Delete the initiative (this will cascade delete objectives, owners, check-ins, etc.)
  await prisma.initiative.delete({
    where: { id },
  })

  // Revalidate the initiatives page
  revalidatePath('/initiatives')

  // Redirect to the initiatives list
  redirect('/initiatives')
}

export async function getInitiatives() {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view initiatives')
  }

  const initiatives = await prisma.initiative.findMany({
    where: { organizationId: user.organizationId },
    include: {
      objectives: true,
      team: true,
      owners: {
        include: {
          person: true,
        },
      },
      _count: {
        select: {
          checkIns: true,
          tasks: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return initiatives
}
