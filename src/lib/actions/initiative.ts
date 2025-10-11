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
  if (validatedData.teamId && validatedData.teamId.trim() !== '') {
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

  // Verify all owners belong to user's organization
  if (validatedData.owners && validatedData.owners.length > 0) {
    const ownerIds = validatedData.owners.map(owner => owner.personId)
    const validOwners = await prisma.person.findMany({
      where: {
        id: { in: ownerIds },
        organizationId: user.organizationId,
      },
    })

    if (validOwners.length !== ownerIds.length) {
      throw new Error(
        'One or more selected owners are invalid or do not belong to your organization'
      )
    }
  }

  // Create the initiative with objectives and owners
  try {
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
        teamId:
          validatedData.teamId && validatedData.teamId.trim() !== ''
            ? validatedData.teamId
            : null,
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
  } catch (error) {
    // Handle specific database errors with user-friendly messages
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message: string }

      if (prismaError.code === 'P2003') {
        // Foreign key constraint violation
        throw new Error(
          'One or more selected team members or teams are invalid. Please check your selections and try again.'
        )
      } else if (prismaError.code === 'P2002') {
        // Unique constraint violation
        throw new Error(
          'An initiative with this title already exists. Please choose a different title.'
        )
      }
    }

    // Re-throw the original error if it's not a known Prisma error
    throw error
  }
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
}

export async function createObjective(
  initiativeId: string,
  title: string,
  keyResult?: string
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to create objectives')
  }

  // Validate the title
  if (!title || title.trim().length === 0) {
    throw new Error('Objective title is required')
  }

  if (title.length > 200) {
    throw new Error('Title must be less than 200 characters')
  }

  // Verify initiative belongs to user's organization
  const initiative = await prisma.initiative.findFirst({
    where: {
      id: initiativeId,
      organizationId: user.organizationId,
    },
  })
  if (!initiative) {
    throw new Error('Initiative not found or access denied')
  }

  // Get the current highest sort index for this initiative
  const lastObjective = await prisma.objective.findFirst({
    where: {
      initiativeId: initiativeId,
    },
    orderBy: {
      sortIndex: 'desc',
    },
  })

  const nextSortIndex = lastObjective ? lastObjective.sortIndex + 1 : 0

  // Create the objective
  const objective = await prisma.objective.create({
    data: {
      title: title.trim(),
      keyResult: keyResult?.trim() || null,
      initiativeId: initiativeId,
      sortIndex: nextSortIndex,
    },
  })

  // Revalidate the initiative page
  revalidatePath(`/initiatives/${initiativeId}`)

  return objective
}

export async function updateInitiativeTeam(
  initiativeId: string,
  teamId: string | null
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to update initiatives')
  }

  // Verify initiative belongs to user's organization
  const existingInitiative = await prisma.initiative.findFirst({
    where: {
      id: initiativeId,
      organizationId: user.organizationId,
    },
  })
  if (!existingInitiative) {
    throw new Error('Initiative not found or access denied')
  }

  // Verify team belongs to user's organization if specified
  if (teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        organizationId: user.organizationId,
      },
    })
    if (!team) {
      throw new Error('Team not found or access denied')
    }
  }

  // Update the initiative team
  const initiative = await prisma.initiative.update({
    where: { id: initiativeId },
    data: {
      teamId: teamId,
    },
    include: {
      team: true,
    },
  })

  // Revalidate the initiative page
  revalidatePath(`/initiatives/${initiativeId}`)

  return initiative
}

export async function addInitiativeOwner(
  initiativeId: string,
  personId: string,
  role: string = 'owner'
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error(
      'User must belong to an organization to manage initiative owners'
    )
  }

  // Verify initiative belongs to user's organization
  const initiative = await prisma.initiative.findFirst({
    where: {
      id: initiativeId,
      organizationId: user.organizationId,
    },
  })
  if (!initiative) {
    throw new Error('Initiative not found or access denied')
  }

  // Verify person belongs to user's organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: user.organizationId,
    },
  })
  if (!person) {
    throw new Error('Person not found or access denied')
  }

  // Check if owner already exists
  const existingOwner = await prisma.initiativeOwner.findFirst({
    where: {
      initiativeId,
      personId,
    },
  })

  if (existingOwner) {
    throw new Error('This person is already an owner of this initiative')
  }

  // Add the owner
  const owner = await prisma.initiativeOwner.create({
    data: {
      initiativeId,
      personId,
      role,
    },
    include: {
      person: true,
    },
  })

  // Revalidate the initiative page
  revalidatePath(`/initiatives/${initiativeId}`)

  return owner
}

export async function removeInitiativeOwner(
  initiativeId: string,
  personId: string
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error(
      'User must belong to an organization to manage initiative owners'
    )
  }

  // Verify initiative belongs to user's organization
  const initiative = await prisma.initiative.findFirst({
    where: {
      id: initiativeId,
      organizationId: user.organizationId,
    },
  })
  if (!initiative) {
    throw new Error('Initiative not found or access denied')
  }

  // Remove the owner
  await prisma.initiativeOwner.deleteMany({
    where: {
      initiativeId,
      personId,
    },
  })

  // Revalidate the initiative page
  revalidatePath(`/initiatives/${initiativeId}`)
}
