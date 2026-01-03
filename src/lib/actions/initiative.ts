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
        size: validatedData.size || null,
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

  // Clear slot if status is being set to done or canceled
  const shouldClearSlot =
    validatedData.status === 'done' || validatedData.status === 'canceled'

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
      size: validatedData.size || null,
      teamId: validatedData.teamId,
      // Clear slot when initiative is completed or canceled
      ...(shouldClearSlot && { slot: null }),
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
  revalidatePath('/initiatives/slots')
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
 * Get all initiatives for the slots view (active initiatives only)
 * Returns initiatives with their slot assignments
 */
export async function getSlottedInitiatives() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    return { slottedInitiatives: [], unslottedInitiatives: [], totalSlots: 0 }
  }

  const organizationId = user.managerOSOrganizationId

  // Get all active initiatives (not done or canceled)
  const activeInitiatives = await prisma.initiative.findMany({
    where: {
      organizationId,
      status: {
        in: ['planned', 'in_progress', 'paused'],
      },
    },
    orderBy: [{ slot: 'asc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      title: true,
      status: true,
      rag: true,
      slot: true,
      size: true,
      targetDate: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      owners: {
        include: {
          person: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
    },
  })

  // Get task counts for all initiatives to calculate progress
  const initiativeIds = activeInitiatives.map(i => i.id)

  const taskCounts = await prisma.task.groupBy({
    by: ['initiativeId'],
    where: {
      OR: [
        { initiativeId: { in: initiativeIds } },
        { objective: { initiativeId: { in: initiativeIds } } },
      ],
    },
    _count: { id: true },
  })

  const completedTaskCounts = await prisma.task.groupBy({
    by: ['initiativeId'],
    where: {
      OR: [
        { initiativeId: { in: initiativeIds } },
        { objective: { initiativeId: { in: initiativeIds } } },
      ],
      status: 'done',
    },
    _count: { id: true },
  })

  // Create maps for quick lookup
  const totalCountMap = new Map(
    taskCounts.map(t => [t.initiativeId, t._count.id])
  )
  const completedCountMap = new Map(
    completedTaskCounts.map(t => [t.initiativeId, t._count.id])
  )

  // Add progress to each initiative
  const initiativesWithProgress = activeInitiatives.map(initiative => {
    const total = totalCountMap.get(initiative.id) || 0
    const completed = completedCountMap.get(initiative.id) || 0
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100)
    return { ...initiative, progress }
  })

  const slottedInitiatives = initiativesWithProgress.filter(
    i => i.slot !== null
  )
  const unslottedInitiatives = initiativesWithProgress.filter(
    i => i.slot === null
  )
  const totalSlots = initiativesWithProgress.length

  return {
    slottedInitiatives,
    unslottedInitiatives,
    totalSlots,
  }
}

/**
 * Assign an initiative to a specific slot
 */
export async function assignInitiativeToSlot(
  initiativeId: string,
  slotNumber: number
) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to manage initiative slots'
    )
  }

  // Check permission to edit initiatives
  if (!(await getActionPermission(user, 'initiative.edit', initiativeId))) {
    throw new Error('You do not have permission to edit this initiative')
  }

  // Verify initiative belongs to user's organization and is active
  const initiative = await prisma.initiative.findFirst({
    where: {
      id: initiativeId,
      organizationId: user.managerOSOrganizationId,
      status: {
        in: ['planned', 'in_progress', 'paused'],
      },
    },
  })

  if (!initiative) {
    throw new Error(
      'Initiative not found, access denied, or initiative is not active'
    )
  }

  // Check if slot is already taken by another initiative
  const existingSlot = await prisma.initiative.findFirst({
    where: {
      organizationId: user.managerOSOrganizationId,
      slot: slotNumber,
      id: { not: initiativeId },
    },
  })

  if (existingSlot) {
    throw new Error('This slot is already assigned to another initiative')
  }

  // Assign the slot
  const updated = await prisma.initiative.update({
    where: { id: initiativeId },
    data: { slot: slotNumber },
  })

  revalidatePath('/initiatives')
  revalidatePath('/initiatives/slots')

  return updated
}

/**
 * Remove an initiative from its slot
 */
export async function removeInitiativeFromSlot(initiativeId: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to manage initiative slots'
    )
  }

  // Check permission to edit initiatives
  if (!(await getActionPermission(user, 'initiative.edit', initiativeId))) {
    throw new Error('You do not have permission to edit this initiative')
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

  // Remove from slot
  const updated = await prisma.initiative.update({
    where: { id: initiativeId },
    data: { slot: null },
  })

  revalidatePath('/initiatives')
  revalidatePath('/initiatives/slots')

  return updated
}

/**
 * Swap slots between two initiatives, or move an initiative to an empty slot
 */
export async function swapInitiativeSlots(
  sourceInitiativeId: string,
  targetSlotNumber: number,
  targetInitiativeId?: string
) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to manage initiative slots'
    )
  }

  // Check permission to edit source initiative
  if (
    !(await getActionPermission(user, 'initiative.edit', sourceInitiativeId))
  ) {
    throw new Error('You do not have permission to edit this initiative')
  }

  // If there's a target initiative, check permission for it too
  if (
    targetInitiativeId &&
    !(await getActionPermission(user, 'initiative.edit', targetInitiativeId))
  ) {
    throw new Error('You do not have permission to edit the target initiative')
  }

  // Get the source initiative
  const sourceInitiative = await prisma.initiative.findFirst({
    where: {
      id: sourceInitiativeId,
      organizationId: user.managerOSOrganizationId,
      status: { in: ['planned', 'in_progress', 'paused'] },
    },
  })

  if (!sourceInitiative) {
    throw new Error('Source initiative not found or is not active')
  }

  const sourceSlot = sourceInitiative.slot

  // Use a transaction to swap slots atomically
  await prisma.$transaction(async tx => {
    // Temporarily set source to null to avoid unique constraint violation
    await tx.initiative.update({
      where: { id: sourceInitiativeId },
      data: { slot: null },
    })

    // If there's a target initiative in the target slot, move it to source slot
    if (targetInitiativeId) {
      await tx.initiative.update({
        where: { id: targetInitiativeId },
        data: { slot: sourceSlot },
      })
    }

    // Move source to target slot
    await tx.initiative.update({
      where: { id: sourceInitiativeId },
      data: { slot: targetSlotNumber },
    })
  })

  revalidatePath('/initiatives')
  revalidatePath('/initiatives/slots')

  return { success: true }
}

/**
 * Update initiative status
 */
export async function updateInitiativeStatus(
  initiativeId: string,
  status: string
) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update initiatives')
  }

  if (!(await getActionPermission(user, 'initiative.edit', initiativeId))) {
    throw new Error('You do not have permission to edit this initiative')
  }

  const existingInitiative = await prisma.initiative.findFirst({
    where: {
      id: initiativeId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!existingInitiative) {
    throw new Error('Initiative not found or access denied')
  }

  // Clear slot if status is being set to done or canceled
  const shouldClearSlot = status === 'done' || status === 'canceled'

  const updated = await prisma.initiative.update({
    where: { id: initiativeId },
    data: {
      status,
      ...(shouldClearSlot && { slot: null }),
    },
  })

  revalidatePath('/initiatives')
  revalidatePath('/initiatives/slots')
  revalidatePath(`/initiatives/${initiativeId}`)

  return updated
}

/**
 * Update initiative RAG status
 */
export async function updateInitiativeRag(initiativeId: string, rag: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update initiatives')
  }

  if (!(await getActionPermission(user, 'initiative.edit', initiativeId))) {
    throw new Error('You do not have permission to edit this initiative')
  }

  const existingInitiative = await prisma.initiative.findFirst({
    where: {
      id: initiativeId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!existingInitiative) {
    throw new Error('Initiative not found or access denied')
  }

  const updated = await prisma.initiative.update({
    where: { id: initiativeId },
    data: { rag },
  })

  revalidatePath('/initiatives')
  revalidatePath(`/initiatives/${initiativeId}`)

  return updated
}

/**
 * Update initiative priority
 */
export async function updateInitiativePriority(
  initiativeId: string,
  priority: number
) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update initiatives')
  }

  if (!(await getActionPermission(user, 'initiative.edit', initiativeId))) {
    throw new Error('You do not have permission to edit this initiative')
  }

  const existingInitiative = await prisma.initiative.findFirst({
    where: {
      id: initiativeId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!existingInitiative) {
    throw new Error('Initiative not found or access denied')
  }

  const updated = await prisma.initiative.update({
    where: { id: initiativeId },
    data: { priority },
  })

  revalidatePath('/initiatives')
  revalidatePath(`/initiatives/${initiativeId}`)

  return updated
}

/**
 * Update initiative size
 */
export async function updateInitiativeSize(
  initiativeId: string,
  size: string | null
) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update initiatives')
  }

  if (!(await getActionPermission(user, 'initiative.edit', initiativeId))) {
    throw new Error('You do not have permission to edit this initiative')
  }

  const existingInitiative = await prisma.initiative.findFirst({
    where: {
      id: initiativeId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!existingInitiative) {
    throw new Error('Initiative not found or access denied')
  }

  const updated = await prisma.initiative.update({
    where: { id: initiativeId },
    data: { size },
  })

  revalidatePath('/initiatives')
  revalidatePath('/initiatives/slots')
  revalidatePath(`/initiatives/${initiativeId}`)

  return updated
}

/**
 * Update initiative start date
 */
export async function updateInitiativeStartDate(
  initiativeId: string,
  startDate: Date | null
) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update initiatives')
  }

  if (!(await getActionPermission(user, 'initiative.edit', initiativeId))) {
    throw new Error('You do not have permission to edit this initiative')
  }

  const existingInitiative = await prisma.initiative.findFirst({
    where: {
      id: initiativeId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!existingInitiative) {
    throw new Error('Initiative not found or access denied')
  }

  const updated = await prisma.initiative.update({
    where: { id: initiativeId },
    data: { startDate },
  })

  revalidatePath('/initiatives')
  revalidatePath(`/initiatives/${initiativeId}`)

  return updated
}

/**
 * Update initiative target date
 */
export async function updateInitiativeTargetDate(
  initiativeId: string,
  targetDate: Date | null
) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update initiatives')
  }

  if (!(await getActionPermission(user, 'initiative.edit', initiativeId))) {
    throw new Error('You do not have permission to edit this initiative')
  }

  const existingInitiative = await prisma.initiative.findFirst({
    where: {
      id: initiativeId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!existingInitiative) {
    throw new Error('Initiative not found or access denied')
  }

  const updated = await prisma.initiative.update({
    where: { id: initiativeId },
    data: { targetDate },
  })

  revalidatePath('/initiatives')
  revalidatePath(`/initiatives/${initiativeId}`)

  return updated
}
