'use server'

import { prisma } from '@/lib/db'
import {
  onboardingAssignmentSchema,
  onboardingItemProgressUpdateSchema,
  type OnboardingAssignmentFormData,
  type OnboardingItemProgressUpdateData,
} from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'
import type { OnboardingStatus } from '@/generated/prisma'

/**
 * Get all onboarding instances for the current organization
 * Used by admins in the oversight view
 */
export async function getOnboardingInstances(options?: {
  status?: OnboardingStatus
  managerId?: string
  teamId?: string
}) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    return []
  }

  // Build where clause based on filters
  const where: {
    organizationId: string
    status?: OnboardingStatus
    managerId?: string
    person?: { teamId?: string }
  } = {
    organizationId: user.managerOSOrganizationId,
  }

  if (options?.status) {
    where.status = options.status
  }
  if (options?.managerId) {
    where.managerId = options.managerId
  }
  if (options?.teamId) {
    where.person = { teamId: options.teamId }
  }

  const instances = await prisma.onboardingInstance.findMany({
    where,
    include: {
      person: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          jobRole: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      template: {
        select: {
          id: true,
          name: true,
        },
      },
      manager: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      mentor: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      itemProgress: {
        select: {
          status: true,
          item: {
            select: {
              isRequired: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Calculate progress for each instance
  return instances.map(instance => {
    const totalItems = instance.itemProgress.length
    const completedItems = instance.itemProgress.filter(
      p => p.status === 'COMPLETED' || p.status === 'SKIPPED'
    ).length
    const requiredItems = instance.itemProgress.filter(
      p => p.item.isRequired
    ).length
    const completedRequiredItems = instance.itemProgress.filter(
      p =>
        p.item.isRequired &&
        (p.status === 'COMPLETED' || p.status === 'SKIPPED')
    ).length

    return {
      ...instance,
      progress: {
        total: totalItems,
        completed: completedItems,
        percentComplete:
          totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
        requiredTotal: requiredItems,
        requiredCompleted: completedRequiredItems,
      },
    }
  })
}

/**
 * Get onboarding instances for direct reports of the current user
 * Used by managers to see their team's onboarding progress
 */
export async function getDirectReportOnboardingInstances() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId || !user.managerOSPersonId) {
    return []
  }

  const instances = await prisma.onboardingInstance.findMany({
    where: {
      organizationId: user.managerOSOrganizationId,
      OR: [
        { managerId: user.managerOSPersonId },
        { person: { managerId: user.managerOSPersonId } },
      ],
    },
    include: {
      person: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          startedAt: true,
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          jobRole: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      template: {
        select: {
          id: true,
          name: true,
        },
      },
      manager: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      mentor: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      itemProgress: {
        select: {
          status: true,
          updatedAt: true,
          item: {
            select: {
              isRequired: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Calculate progress and detect "stuck" instances
  const now = new Date()
  const stuckThresholdDays = 3 // No progress in 3 days

  return instances.map(instance => {
    const totalItems = instance.itemProgress.length
    const completedItems = instance.itemProgress.filter(
      p => p.status === 'COMPLETED' || p.status === 'SKIPPED'
    ).length

    // Find last progress update
    const lastProgressUpdate = instance.itemProgress
      .filter(p => p.status !== 'PENDING')
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0]

    const lastActivityDate = lastProgressUpdate?.updatedAt || instance.createdAt
    const daysSinceActivity = Math.floor(
      (now.getTime() - new Date(lastActivityDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    const requiredItems = instance.itemProgress.filter(
      p => p.item.isRequired
    ).length
    const completedRequiredItems = instance.itemProgress.filter(
      p =>
        p.item.isRequired &&
        (p.status === 'COMPLETED' || p.status === 'SKIPPED')
    ).length

    const isStuck =
      instance.status === 'IN_PROGRESS' &&
      daysSinceActivity >= stuckThresholdDays &&
      completedItems < totalItems

    return {
      ...instance,
      progress: {
        total: totalItems,
        completed: completedItems,
        percentComplete:
          totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
        requiredTotal: requiredItems,
        requiredCompleted: completedRequiredItems,
      },
      isStuck,
      daysSinceActivity,
    }
  })
}

/**
 * Get the current user's active onboarding instance (if any)
 * Used for the onboardee's dashboard widget and onboarding page
 */
export async function getMyOnboardingInstance() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId || !user.managerOSPersonId) {
    return null
  }

  const instance = await prisma.onboardingInstance.findFirst({
    where: {
      personId: user.managerOSPersonId,
      organizationId: user.managerOSOrganizationId,
      status: {
        in: ['NOT_STARTED', 'IN_PROGRESS'],
      },
    },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      manager: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      mentor: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      itemProgress: {
        include: {
          item: {
            include: {
              phase: {
                select: {
                  id: true,
                  name: true,
                  sortOrder: true,
                },
              },
            },
          },
          completedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { item: { phase: { sortOrder: 'asc' } } },
          { item: { sortOrder: 'asc' } },
        ],
      },
    },
  })

  if (!instance) {
    return null
  }

  // Group items by phase for easier rendering
  const phases = new Map<
    string,
    {
      id: string
      name: string
      sortOrder: number
      items: typeof instance.itemProgress
    }
  >()

  for (const progress of instance.itemProgress) {
    const phase = progress.item.phase
    if (!phases.has(phase.id)) {
      phases.set(phase.id, {
        id: phase.id,
        name: phase.name,
        sortOrder: phase.sortOrder,
        items: [],
      })
    }
    phases.get(phase.id)!.items.push(progress)
  }

  // Calculate overall progress
  const totalItems = instance.itemProgress.length
  const completedItems = instance.itemProgress.filter(
    p => p.status === 'COMPLETED' || p.status === 'SKIPPED'
  ).length

  return {
    ...instance,
    phases: Array.from(phases.values()).sort(
      (a, b) => a.sortOrder - b.sortOrder
    ),
    progress: {
      total: totalItems,
      completed: completedItems,
      percentComplete:
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    },
  }
}

/**
 * Assign onboarding to a person (create instance)
 */
export async function assignOnboarding(formData: OnboardingAssignmentFormData) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Validate form data
  const validatedData = onboardingAssignmentSchema.parse(formData)

  // Verify person belongs to organization
  const person = await prisma.person.findFirst({
    where: {
      id: validatedData.personId,
      organizationId: user.managerOSOrganizationId,
    },
    include: {
      manager: {
        select: { id: true },
      },
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  // Check permission: must be person's manager or admin
  const isPersonsManager = person.managerId === user.managerOSPersonId
  const isAdmin = isAdminOrOwner(user)

  if (!isPersonsManager && !isAdmin) {
    throw new Error(
      "Only the person's manager or an admin can assign onboarding"
    )
  }

  // Verify template belongs to organization and is active
  const template = await prisma.onboardingTemplate.findFirst({
    where: {
      id: validatedData.templateId,
      organizationId: user.managerOSOrganizationId,
      isActive: true,
    },
    include: {
      phases: {
        include: {
          items: true,
        },
      },
    },
  })

  if (!template) {
    throw new Error('Template not found, inactive, or access denied')
  }

  // Ensure template has at least one item
  const allItems = template.phases.flatMap(phase => phase.items)
  if (allItems.length === 0) {
    throw new Error(
      'Cannot assign this template - it has no items. Please add items to the template first.'
    )
  }

  // Check if person already has an active onboarding with this template
  const existingInstance = await prisma.onboardingInstance.findFirst({
    where: {
      personId: validatedData.personId,
      templateId: validatedData.templateId,
      status: {
        in: ['NOT_STARTED', 'IN_PROGRESS'],
      },
    },
  })

  if (existingInstance) {
    throw new Error(
      'Person already has an active onboarding with this template'
    )
  }

  // Verify manager belongs to organization if specified
  if (validatedData.managerId) {
    const manager = await prisma.person.findFirst({
      where: {
        id: validatedData.managerId,
        organizationId: user.managerOSOrganizationId,
      },
    })
    if (!manager) {
      throw new Error('Manager not found or access denied')
    }
  }

  // Verify mentor belongs to organization if specified
  if (validatedData.mentorId) {
    const mentor = await prisma.person.findFirst({
      where: {
        id: validatedData.mentorId,
        organizationId: user.managerOSOrganizationId,
      },
    })
    if (!mentor) {
      throw new Error('Mentor not found or access denied')
    }
  }

  // Create the instance with progress records for all items
  // Note: allItems was computed earlier for validation

  const instance = await prisma.onboardingInstance.create({
    data: {
      templateId: validatedData.templateId,
      personId: validatedData.personId,
      organizationId: user.managerOSOrganizationId,
      status: 'NOT_STARTED',
      managerId: validatedData.managerId || person.managerId || null,
      mentorId: validatedData.mentorId || null,
      itemProgress: {
        create: allItems.map(item => ({
          itemId: item.id,
          status: 'PENDING',
        })),
      },
    },
    include: {
      person: {
        select: {
          id: true,
          name: true,
        },
      },
      template: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  revalidatePath('/onboarding')
  revalidatePath('/onboarding/overview')
  revalidatePath(`/people/${validatedData.personId}`)
  revalidatePath('/dashboard')

  return instance
}

/**
 * Update progress on an onboarding item
 */
export async function updateOnboardingItemProgress(
  progressId: string,
  data: OnboardingItemProgressUpdateData
) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId || !user.managerOSPersonId) {
    throw new Error('User must belong to an organization')
  }

  // Validate data
  const validatedData = onboardingItemProgressUpdateSchema.parse(data)

  // Get the progress record with instance and item details
  const progress = await prisma.onboardingItemProgress.findFirst({
    where: {
      id: progressId,
      instance: {
        organizationId: user.managerOSOrganizationId,
      },
    },
    include: {
      instance: {
        select: {
          id: true,
          personId: true,
          managerId: true,
          mentorId: true,
          status: true,
        },
      },
      item: {
        select: {
          type: true,
          ownerType: true,
        },
      },
    },
  })

  if (!progress) {
    throw new Error('Progress record not found or access denied')
  }

  // Determine who can complete this item
  const isOnboardee = progress.instance.personId === user.managerOSPersonId
  const isManager = progress.instance.managerId === user.managerOSPersonId
  const isMentor = progress.instance.mentorId === user.managerOSPersonId
  const isAdmin = isAdminOrOwner(user)

  // Checkpoint items require manager or mentor confirmation
  if (progress.item.type === 'CHECKPOINT') {
    if (!isManager && !isMentor && !isAdmin) {
      throw new Error(
        'Only the manager or mentor can complete checkpoint items'
      )
    }
  } else {
    // Other items can be completed by onboardee, manager, mentor, or admin
    if (!isOnboardee && !isManager && !isMentor && !isAdmin) {
      throw new Error('You do not have permission to update this item')
    }
  }

  // Update the progress
  const updatedProgress = await prisma.onboardingItemProgress.update({
    where: { id: progressId },
    data: {
      status: validatedData.status,
      notes: validatedData.notes,
      completedAt:
        validatedData.status === 'COMPLETED' ||
        validatedData.status === 'SKIPPED'
          ? new Date()
          : null,
      completedById:
        validatedData.status === 'COMPLETED' ||
        validatedData.status === 'SKIPPED'
          ? user.managerOSPersonId
          : null,
    },
  })

  // Update instance status if needed
  if (
    progress.instance.status === 'NOT_STARTED' &&
    validatedData.status !== 'PENDING'
  ) {
    await prisma.onboardingInstance.update({
      where: { id: progress.instance.id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    })
  }

  // Check if all required items are complete
  const allProgress = await prisma.onboardingItemProgress.findMany({
    where: { instanceId: progress.instance.id },
    include: {
      item: {
        select: { isRequired: true },
      },
    },
  })

  const allRequiredComplete = allProgress
    .filter(p => p.item.isRequired)
    .every(p => p.status === 'COMPLETED' || p.status === 'SKIPPED')

  // Auto-complete instance if all required items are done
  // Note: Full completion still requires explicit action, but we could auto-suggest
  if (allRequiredComplete) {
    // We don't auto-complete, but we could trigger a notification here
    // For now, just log or leave for manual completion
  }

  revalidatePath('/onboarding')
  revalidatePath('/onboarding/overview')
  revalidatePath('/dashboard')

  return updatedProgress
}

/**
 * Complete an onboarding instance (explicit action)
 */
export async function completeOnboarding(instanceId: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  const instance = await prisma.onboardingInstance.findFirst({
    where: {
      id: instanceId,
      organizationId: user.managerOSOrganizationId,
    },
    include: {
      itemProgress: {
        include: {
          item: {
            select: { isRequired: true },
          },
        },
      },
    },
  })

  if (!instance) {
    throw new Error('Onboarding instance not found or access denied')
  }

  // Check permission: must be manager or admin
  const isManager = instance.managerId === user.managerOSPersonId
  const isAdmin = isAdminOrOwner(user)

  if (!isManager && !isAdmin) {
    throw new Error(
      'Only the onboarding manager or an admin can complete this onboarding'
    )
  }

  // Verify all required items are complete
  const incompleteRequired = instance.itemProgress.filter(
    p => p.item.isRequired && p.status !== 'COMPLETED' && p.status !== 'SKIPPED'
  )

  if (incompleteRequired.length > 0) {
    throw new Error(
      `Cannot complete onboarding: ${incompleteRequired.length} required items are not complete`
    )
  }

  const updatedInstance = await prisma.onboardingInstance.update({
    where: { id: instanceId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  })

  revalidatePath('/onboarding')
  revalidatePath('/onboarding/overview')
  revalidatePath(`/people/${instance.personId}`)
  revalidatePath('/dashboard')

  return updatedInstance
}

/**
 * Cancel an onboarding instance
 */
export async function cancelOnboarding(instanceId: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  const instance = await prisma.onboardingInstance.findFirst({
    where: {
      id: instanceId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!instance) {
    throw new Error('Onboarding instance not found or access denied')
  }

  // Check permission: must be manager or admin
  const isManager = instance.managerId === user.managerOSPersonId
  const isAdmin = isAdminOrOwner(user)

  if (!isManager && !isAdmin) {
    throw new Error(
      'Only the onboarding manager or an admin can cancel this onboarding'
    )
  }

  const updatedInstance = await prisma.onboardingInstance.update({
    where: { id: instanceId },
    data: {
      status: 'CANCELLED',
    },
  })

  revalidatePath('/onboarding')
  revalidatePath('/onboarding/overview')
  revalidatePath(`/people/${instance.personId}`)
  revalidatePath('/dashboard')

  return updatedInstance
}

/**
 * Get onboarding statistics for the dashboard
 */
export async function getOnboardingStats() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    return null
  }

  const [totalActive, inProgress, completed, byStatus] = await Promise.all([
    prisma.onboardingInstance.count({
      where: {
        organizationId: user.managerOSOrganizationId,
        status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
      },
    }),
    prisma.onboardingInstance.count({
      where: {
        organizationId: user.managerOSOrganizationId,
        status: 'IN_PROGRESS',
      },
    }),
    prisma.onboardingInstance.count({
      where: {
        organizationId: user.managerOSOrganizationId,
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    }),
    prisma.onboardingInstance.groupBy({
      by: ['status'],
      where: {
        organizationId: user.managerOSOrganizationId,
      },
      _count: true,
    }),
  ])

  return {
    totalActive,
    inProgress,
    completedLast30Days: completed,
    byStatus: byStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count
        return acc
      },
      {} as Record<OnboardingStatus, number>
    ),
  }
}

/**
 * Get onboarding instance for a specific person
 * Used on the person detail page to show their onboarding status
 */
export async function getOnboardingForPerson(personId: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    return null
  }

  // Get the most recent active or completed onboarding for this person
  const instance = await prisma.onboardingInstance.findFirst({
    where: {
      personId,
      organizationId: user.managerOSOrganizationId,
    },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          phases: {
            select: {
              items: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
      manager: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      mentor: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      itemProgress: {
        include: {
          item: {
            select: {
              id: true,
              title: true,
              description: true,
              type: true,
              sortOrder: true,
              isRequired: true,
              linkedUrl: true,
              ownerType: true,
              phase: {
                select: {
                  id: true,
                  name: true,
                  sortOrder: true,
                },
              },
            },
          },
        },
        orderBy: [
          { item: { phase: { sortOrder: 'asc' } } },
          { item: { sortOrder: 'asc' } },
        ],
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!instance) {
    return null
  }

  // Check for out-of-sync items (items in template but not in instance)
  const templateItemIds = new Set(
    instance.template.phases.flatMap(phase => phase.items.map(item => item.id))
  )
  const instanceItemIds = new Set(instance.itemProgress.map(p => p.item.id))
  const missingItemCount = [...templateItemIds].filter(
    id => !instanceItemIds.has(id)
  ).length

  // Calculate progress
  const totalItems = instance.itemProgress.length
  const completedItems = instance.itemProgress.filter(
    p => p.status === 'COMPLETED' || p.status === 'SKIPPED'
  ).length
  const requiredItems = instance.itemProgress.filter(
    p => p.item.isRequired
  ).length
  const completedRequiredItems = instance.itemProgress.filter(
    p =>
      p.item.isRequired && (p.status === 'COMPLETED' || p.status === 'SKIPPED')
  ).length

  // Get current phase (first phase with incomplete items)
  const phases = new Map<
    string,
    { name: string; sortOrder: number; completed: number; total: number }
  >()
  for (const progress of instance.itemProgress) {
    const phaseId = progress.item.phase.id
    if (!phases.has(phaseId)) {
      phases.set(phaseId, {
        name: progress.item.phase.name,
        sortOrder: progress.item.phase.sortOrder,
        completed: 0,
        total: 0,
      })
    }
    const phase = phases.get(phaseId)!
    phase.total++
    if (progress.status === 'COMPLETED' || progress.status === 'SKIPPED') {
      phase.completed++
    }
  }

  const sortedPhases = Array.from(phases.entries())
    .sort((a, b) => a[1].sortOrder - b[1].sortOrder)
    .map(([id, data]) => ({ id, ...data }))

  const currentPhase =
    sortedPhases.find(p => p.completed < p.total) ||
    sortedPhases[sortedPhases.length - 1]

  // Clean up template to not include phases (only needed for calculation)
  const { phases: _templatePhases, ...templateWithoutPhases } =
    instance.template

  return {
    ...instance,
    template: templateWithoutPhases,
    progress: {
      total: totalItems,
      completed: completedItems,
      percentComplete:
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      requiredTotal: requiredItems,
      requiredCompleted: completedRequiredItems,
    },
    currentPhase,
    phases: sortedPhases,
    missingItemCount,
  }
}

/**
 * Sync items from the template to an existing onboarding instance.
 * This adds any items that exist in the template but are missing from the instance.
 * Useful when items are added to a template after an onboarding has been assigned.
 */
export async function syncOnboardingInstanceItems(instanceId: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get the instance with its current itemProgress
  const instance = await prisma.onboardingInstance.findFirst({
    where: {
      id: instanceId,
      organizationId: user.managerOSOrganizationId,
    },
    include: {
      template: {
        include: {
          phases: {
            include: {
              items: true,
            },
          },
        },
      },
      itemProgress: {
        select: {
          itemId: true,
        },
      },
    },
  })

  if (!instance) {
    throw new Error('Onboarding instance not found or access denied')
  }

  // Check permission: must be manager or admin
  const isManager = instance.managerId === user.managerOSPersonId
  const isAdmin = isAdminOrOwner(user)

  if (!isManager && !isAdmin) {
    throw new Error('Only the onboarding manager or an admin can sync items')
  }

  // Can only sync active instances
  if (instance.status === 'COMPLETED' || instance.status === 'CANCELLED') {
    throw new Error('Cannot sync items for completed or cancelled onboarding')
  }

  // Get all items from the template
  const templateItems = instance.template.phases.flatMap(phase => phase.items)

  // Find items that exist in template but not in instance
  const existingItemIds = new Set(instance.itemProgress.map(p => p.itemId))
  const missingItems = templateItems.filter(
    item => !existingItemIds.has(item.id)
  )

  if (missingItems.length === 0) {
    return { added: 0, message: 'All items are already synced' }
  }

  // Create progress records for missing items
  await prisma.onboardingItemProgress.createMany({
    data: missingItems.map(item => ({
      instanceId: instance.id,
      itemId: item.id,
      status: 'PENDING',
    })),
  })

  revalidatePath('/onboarding')
  revalidatePath('/onboarding/overview')
  revalidatePath(`/people/${instance.personId}`)
  revalidatePath(`/people/${instance.personId}/onboarding`)

  return {
    added: missingItems.length,
    message: `Added ${missingItems.length} item${missingItems.length === 1 ? '' : 's'} from the template`,
  }
}

/**
 * Reinitialize an onboarding instance with fresh items from the template.
 * This deletes all existing progress and recreates itemProgress records.
 * Use this when itemProgress was lost due to template updates.
 */
export async function reinitializeOnboardingInstance(instanceId: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get the instance
  const instance = await prisma.onboardingInstance.findFirst({
    where: {
      id: instanceId,
      organizationId: user.managerOSOrganizationId,
    },
    include: {
      template: {
        include: {
          phases: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  })

  if (!instance) {
    throw new Error('Onboarding instance not found or access denied')
  }

  // Check permission: must be manager or admin
  const isManager = instance.managerId === user.managerOSPersonId
  const isAdmin = isAdminOrOwner(user)

  if (!isManager && !isAdmin) {
    throw new Error(
      'Only the onboarding manager or an admin can reinitialize items'
    )
  }

  // Can only reinitialize active instances
  if (instance.status === 'COMPLETED' || instance.status === 'CANCELLED') {
    throw new Error(
      'Cannot reinitialize items for completed or cancelled onboarding'
    )
  }

  // Get all items from the template
  const templateItems = instance.template.phases.flatMap(phase => phase.items)

  if (templateItems.length === 0) {
    throw new Error(
      'Template has no items. Please add items to the template first.'
    )
  }

  // Delete all existing itemProgress for this instance
  await prisma.onboardingItemProgress.deleteMany({
    where: { instanceId: instance.id },
  })

  // Create fresh itemProgress records
  await prisma.onboardingItemProgress.createMany({
    data: templateItems.map(item => ({
      instanceId: instance.id,
      itemId: item.id,
      status: 'PENDING',
    })),
  })

  // Reset instance status to NOT_STARTED
  await prisma.onboardingInstance.update({
    where: { id: instance.id },
    data: {
      status: 'NOT_STARTED',
      startedAt: null,
      completedAt: null,
    },
  })

  revalidatePath('/onboarding')
  revalidatePath('/onboarding/overview')
  revalidatePath(`/people/${instance.personId}`)
  revalidatePath(`/people/${instance.personId}/onboarding`)

  return {
    itemCount: templateItems.length,
    message: `Reinitialized onboarding with ${templateItems.length} item${templateItems.length === 1 ? '' : 's'} from the template`,
  }
}
