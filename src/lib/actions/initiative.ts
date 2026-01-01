'use server'

import { prisma } from '@/lib/db'
import { initiativeSchema, type InitiativeFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'
import {
  checkOrganizationLimit,
  getOrganizationCounts,
} from '@/lib/subscription-utils'

export async function createInitiative(formData: InitiativeFormData) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
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
        organizationId: user.managerOSOrganizationId,
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
        organizationId: user.managerOSOrganizationId,
      },
    })

    if (validOwners.length !== ownerIds.length) {
      throw new Error(
        'One or more selected owners are invalid or do not belong to your organization'
      )
    }
  }

  // Check organization limits before creating
  const counts = await getOrganizationCounts(user.managerOSOrganizationId)
  const limitCheck = await checkOrganizationLimit(
    user.managerOSOrganizationId,
    'initiatives',
    counts?.initiatives ?? 0
  )

  if (!limitCheck) {
    throw new Error('Initiatives limit exceeded')
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
        priority: validatedData.priority,
        teamId:
          validatedData.teamId && validatedData.teamId.trim() !== ''
            ? validatedData.teamId
            : null,
        organizationId: user.managerOSOrganizationId,
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
    // Revalidate layout to update sidebar badge counts
    revalidatePath('/', 'layout')

    // Return the created initiative
    return initiative
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
  const { getActionPermission } = await import('@/lib/auth-utils')

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update initiatives')
  }

  // Check permission to edit initiatives
  if (!(await getActionPermission(user, 'initiative.edit', id))) {
    throw new Error('You do not have permission to edit initiatives')
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
      organizationId: user.managerOSOrganizationId,
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
        organizationId: user.managerOSOrganizationId,
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
      priority: validatedData.priority,
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
  // Revalidate layout to update sidebar badge counts
  revalidatePath('/', 'layout')

  // Return the updated initiative
  return initiative
}

export async function deleteInitiative(id: string) {
  const user = await getCurrentUser()
  const { getActionPermission } = await import('@/lib/auth-utils')

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to delete initiatives')
  }

  // Check permission to delete initiatives
  if (!(await getActionPermission(user, 'initiative.delete', id))) {
    throw new Error('You do not have permission to delete initiatives')
  }

  // Verify initiative belongs to user's organization
  const existingInitiative = await prisma.initiative.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
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
  // Revalidate layout to update sidebar badge counts
  revalidatePath('/', 'layout')
}

export async function createObjective(
  initiativeId: string,
  title: string,
  keyResult?: string
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
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
      organizationId: user.managerOSOrganizationId,
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
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update initiatives')
  }

  // Verify initiative belongs to user's organization
  const existingInitiative = await prisma.initiative.findFirst({
    where: {
      id: initiativeId,
      organizationId: user.managerOSOrganizationId,
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
        organizationId: user.managerOSOrganizationId,
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
  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to manage initiative owners'
    )
  }

  // Verify initiative belongs to user's organization
  const initiative = await prisma.initiative.findFirst({
    where: {
      id: initiativeId,
      organizationId: user.managerOSOrganizationId,
    },
  })
  if (!initiative) {
    throw new Error('Initiative not found or access denied')
  }

  // Verify person belongs to user's organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: user.managerOSOrganizationId,
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
  // Revalidate layout to update sidebar badge counts
  revalidatePath('/', 'layout')

  return owner
}

export async function removeInitiativeOwner(
  initiativeId: string,
  personId: string
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to manage initiative owners'
    )
  }

  // Verify initiative belongs to user's organization
  const initiative = await prisma.initiative.findFirst({
    where: {
      id: initiativeId,
      organizationId: user.managerOSOrganizationId,
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
  // Revalidate layout to update sidebar badge counts
  revalidatePath('/', 'layout')
}

/**
 * Get initiative owners for a specific initiative
 */
export async function getInitiativeOwners(initiativeId: string) {
  const user = await getCurrentUser()

  const hasPermission = await getActionPermission(
    user,
    'initiative.view',
    initiativeId
  )

  if (!hasPermission) {
    throw new Error('You do not have permission to view this initiative')
  }

  return await prisma.initiativeOwner.findMany({
    where: { initiativeId },
    include: {
      person: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  })
}

/**
 * Get an initiative by ID with all necessary relations for the detail page
 */
export async function getInitiativeById(id: string) {
  const user = await getCurrentUser()

  const hasPermission = await getActionPermission(user, 'initiative.view', id)

  if (!hasPermission) {
    throw new Error('You do not have permission to view this initiative')
  }

  // Filter by organizationId to ensure organization isolation
  return await prisma.initiative.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId || '',
    },
    include: {
      objectives: true,
      tasks: {
        include: {
          assignee: true,
          createdBy: true,
          objective: true,
          initiative: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      checkIns: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: true,
        },
      },
      team: true,
      owners: {
        include: {
          person: {
            include: {
              team: true,
              jobRole: {
                include: {
                  level: true,
                  domain: true,
                },
              },
              manager: {
                include: {
                  reports: true,
                },
              },
              reports: true,
            },
          },
        },
      },
    },
  })
}
