'use server'

import { prisma } from '@/lib/db'
import {
  personSchema,
  type PersonFormData,
  personUpdateSchema,
  type PersonUpdateData,
} from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'
import { Prisma } from '@/generated/prisma'
import { getTasksForAssignee } from '@/lib/data/tasks'
import { getLinkedAccountAvatars } from '@/lib/actions/avatar'
import {
  checkOrganizationLimit,
  getOrganizationCounts,
} from '@/lib/subscription-utils'
import { getFeedbackForPerson } from '@/lib/actions/feedback'
import { PersonWithRelations } from '../../types/person'

/**
 * Get all people for an organization with relations needed for components
 */
export async function getPeopleForOrganization() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    return []
  }

  return await prisma.person.findMany({
    where: {
      organizationId: user.managerOSOrganizationId,
    },
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
    orderBy: { name: 'asc' },
  })
}

export async function getPeopleHierarchy() {
  const user = await getCurrentUser()

  try {
    if (!user.managerOSOrganizationId) {
      return []
    }

    // Get all people with their manager and reports relationships
    const people = await prisma.person.findMany({
      where: {
        organizationId: user.managerOSOrganizationId,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            birthday: true,
            reports: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                birthday: true,
              },
            },
          },
        },
        reports: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            birthday: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            organizationId: true,
            avatar: true,
            parentId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        jobRole: {
          select: {
            id: true,
            title: true,
            level: true,
            domain: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Define the hierarchy item type

    // Build hierarchical structure
    const hierarchy: PersonWithRelations[] = []

    // Find top-level people (those without managers)
    const topLevelPeople = people.filter(person => !person.managerId)

    // Recursive function to build hierarchy
    function buildHierarchy(person: PersonWithRelations, level: number = 0) {
      hierarchy.push({
        ...person,
        level,
      })

      // Add reports recursively
      person.reports.forEach(report => {
        const fullReport = people.find(p => p.id === report.id)
        if (fullReport) {
          buildHierarchy(
            fullReport as unknown as PersonWithRelations,
            level + 1
          )
        }
      })
    }

    // Build hierarchy starting from top-level people
    topLevelPeople.forEach(person =>
      buildHierarchy(person as unknown as PersonWithRelations)
    )

    return hierarchy
  } catch (error) {
    console.error('Error fetching people hierarchy:', error)
    return []
  }
}

export async function createPerson(formData: PersonFormData) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error('Only organization admins or owners can create people')
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to create people')
  }

  // Validate the form data
  const validatedData = personSchema.parse(formData)

  // Parse startedAt date if provided
  const startedAt = validatedData.startedAt
    ? new Date(validatedData.startedAt)
    : null

  // Parse birthday date if provided - treat as date-only to avoid timezone issues
  const birthday = validatedData.birthday
    ? new Date(validatedData.birthday + 'T00:00:00')
    : null

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

  // Verify manager belongs to user's organization if specified
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

  // Verify job role belongs to user's organization if specified
  if (validatedData.jobRoleId) {
    const jobRole = await prisma.jobRole.findFirst({
      where: {
        id: validatedData.jobRoleId,
        organizationId: user.managerOSOrganizationId,
      },
    })
    if (!jobRole) {
      throw new Error('Job role not found or access denied')
    }
  }

  // Check organization limits before creating
  const counts = await getOrganizationCounts(user.managerOSOrganizationId)
  const limitCheck = await checkOrganizationLimit(
    user.managerOSOrganizationId,
    'people',
    counts?.people ?? 0
  )

  if (!limitCheck) {
    throw new Error('People limit exceeded')
  }

  // Create the person
  const createdPerson = await prisma.person.create({
    data: {
      name: validatedData.name,
      email: validatedData.email || null,
      role: validatedData.role,
      status: validatedData.status,
      birthday,
      avatar: validatedData.avatar || null,
      employeeType: validatedData.employeeType || null,
      teamId: validatedData.teamId || null,
      managerId: validatedData.managerId || null,
      jobRoleId: validatedData.jobRoleId || null,
      startedAt,
      organizationId: user.managerOSOrganizationId,
    },
    include: {
      team: true,
      manager: true,
      jobRole: {
        include: {
          level: true,
          domain: true,
        },
      },
    },
  })

  // Revalidate the people page
  revalidatePath('/people')
  // Revalidate the new person's detail page
  revalidatePath(`/people/${createdPerson.id}`)

  // Return the created person
  return createdPerson
}

export async function updatePerson(id: string, formData: PersonFormData) {
  const user = await getCurrentUser()

  // Check if user is admin
  if (!isAdminOrOwner(user)) {
    throw new Error('Only organization admins or owners can update people')
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update people')
  }

  // Validate the form data
  const validatedData = personSchema.parse(formData)

  // Parse startedAt date if provided
  const startedAt = validatedData.startedAt
    ? new Date(validatedData.startedAt)
    : null

  // Parse birthday date if provided - treat as date-only to avoid timezone issues
  const birthday = validatedData.birthday
    ? new Date(validatedData.birthday + 'T00:00:00')
    : null

  // Verify person belongs to user's organization
  const existingPerson = await prisma.person.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
  })
  if (!existingPerson) {
    throw new Error('Person not found or access denied')
  }

  // Store old manager ID and status to check for changes
  const oldManagerId = existingPerson.managerId
  const oldStatus = existingPerson.status

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

  // Verify manager belongs to user's organization if specified
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

  // Verify job role belongs to user's organization if specified
  if (validatedData.jobRoleId) {
    const jobRole = await prisma.jobRole.findFirst({
      where: {
        id: validatedData.jobRoleId,
        organizationId: user.managerOSOrganizationId,
      },
    })
    if (!jobRole) {
      throw new Error('Job role not found or access denied')
    }
  }

  // Update the person
  const updatedPerson = await prisma.person.update({
    where: { id },
    data: {
      name: validatedData.name,
      email: validatedData.email || null,
      role: validatedData.role,
      status: validatedData.status,
      birthday,
      avatar: validatedData.avatar || null,
      employeeType: validatedData.employeeType || null,
      teamId: validatedData.teamId || null,
      managerId: validatedData.managerId || null,
      jobRoleId: validatedData.jobRoleId || null,
      startedAt,
    },
    include: {
      team: true,
      manager: true,
      jobRole: {
        include: {
          level: true,
          domain: true,
        },
      },
    },
  })

  // Auto-resolve manager span exceptions if manager changed
  // Compare against updatedPerson.managerId (normalized database value) instead of validatedData.managerId
  // to avoid issues with undefined vs null comparison
  if (oldManagerId !== updatedPerson.managerId) {
    const { resolveManagerSpanExceptions } = await import(
      '@/lib/tolerance-rules/resolve-exceptions'
    )
    // Check old manager (if they had too many reports, they might now be below threshold)
    if (oldManagerId) {
      await resolveManagerSpanExceptions(
        user.managerOSOrganizationId,
        oldManagerId
      )
    }
    // Check new manager (if they were at threshold, adding a report might create an exception, but we don't resolve here)
    // The evaluation job will create exceptions if needed
  }

  // Auto-resolve manager span exceptions if status changed (affects active report count)
  // If person's status changed from active to inactive, their manager's active report count decreased
  // If person's status changed from inactive to active, their manager's active report count increased
  // We only need to check if status changed and person has a manager
  if (oldStatus !== updatedPerson.status && updatedPerson.managerId) {
    const { resolveManagerSpanExceptions } = await import(
      '@/lib/tolerance-rules/resolve-exceptions'
    )
    // If person became inactive, manager's active report count decreased (might be within threshold now)
    // If person became active, manager's active report count increased (evaluation job will create exceptions if needed)
    // We only resolve if person became inactive (report count decreased)
    if (oldStatus === 'active' && updatedPerson.status === 'inactive') {
      await resolveManagerSpanExceptions(
        user.managerOSOrganizationId,
        updatedPerson.managerId
      )
    }
  }

  // Revalidate the people page and person detail page
  revalidatePath('/people')
  revalidatePath(`/people/${id}`)
  revalidatePath('/exceptions')

  // Return the updated person
  return updatedPerson
}

export async function updatePersonPartial(
  id: string,
  updateData: PersonUpdateData
) {
  const user = await getCurrentUser()

  // Check if user is admin
  if (!isAdminOrOwner(user)) {
    throw new Error('Only organization admins or owners can update people')
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update people')
  }

  // Validate the update data
  const validatedData = personUpdateSchema.parse(updateData)

  // Verify person belongs to user's organization
  const existingPerson = await prisma.person.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
  })
  if (!existingPerson) {
    throw new Error('Person not found or access denied')
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

  // Verify manager belongs to user's organization if specified
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

  // Verify job role belongs to user's organization if specified
  if (validatedData.jobRoleId) {
    const jobRole = await prisma.jobRole.findFirst({
      where: {
        id: validatedData.jobRoleId,
        organizationId: user.managerOSOrganizationId,
      },
    })
    if (!jobRole) {
      throw new Error('Job role not found or access denied')
    }
  }

  // Parse startedAt date if provided
  const startedAt = validatedData.startedAt
    ? new Date(validatedData.startedAt)
    : undefined

  // Parse birthday date if provided - treat as date-only to avoid timezone issues
  const birthday = validatedData.birthday
    ? new Date(validatedData.birthday + 'T00:00:00')
    : undefined

  // Store old job role ID if it exists before update (for revalidation)
  const oldJobRoleId = existingPerson.jobRoleId
  // Store old manager ID and status to check for changes
  const oldManagerId = existingPerson.managerId
  const oldStatus = existingPerson.status

  // Build update data object with only provided fields
  const updateFields: Partial<Prisma.PersonUpdateInput> = {}
  if (validatedData.name !== undefined) updateFields.name = validatedData.name
  if (validatedData.email !== undefined)
    updateFields.email = validatedData.email || null
  if (validatedData.role !== undefined) updateFields.role = validatedData.role
  if (validatedData.status !== undefined)
    updateFields.status = validatedData.status
  if (birthday !== undefined) updateFields.birthday = birthday
  if (validatedData.avatar !== undefined)
    updateFields.avatar = validatedData.avatar || null
  if (validatedData.teamId !== undefined) {
    updateFields.team = validatedData.teamId
      ? { connect: { id: validatedData.teamId } }
      : { disconnect: true }
  }
  if (validatedData.managerId !== undefined) {
    updateFields.manager = validatedData.managerId
      ? { connect: { id: validatedData.managerId } }
      : { disconnect: true }
  }
  if (validatedData.jobRoleId !== undefined) {
    updateFields.jobRole = validatedData.jobRoleId
      ? { connect: { id: validatedData.jobRoleId } }
      : { disconnect: true }
  }
  if (startedAt !== undefined) updateFields.startedAt = startedAt

  // Update the person
  const updatedPerson = await prisma.person.update({
    where: { id },
    data: updateFields,
    include: {
      team: true,
      manager: true,
      jobRole: {
        include: {
          level: true,
          domain: true,
        },
      },
    },
  })

  // Auto-resolve manager span exceptions if manager changed
  if (
    validatedData.managerId !== undefined &&
    oldManagerId !== updatedPerson.managerId
  ) {
    const { resolveManagerSpanExceptions } = await import(
      '@/lib/tolerance-rules/resolve-exceptions'
    )
    // Check old manager (if they had too many reports, they might now be below threshold)
    if (oldManagerId) {
      await resolveManagerSpanExceptions(
        user.managerOSOrganizationId,
        oldManagerId
      )
    }
    // Check new manager (if they were at threshold, adding a report might create an exception, but we don't resolve here)
    // The evaluation job will create exceptions if needed
  }

  // Auto-resolve manager span exceptions if status changed (affects active report count)
  // If person's status changed from active to inactive, their manager's active report count decreased
  // We only need to check if status changed and person has a manager
  if (
    validatedData.status !== undefined &&
    oldStatus !== updatedPerson.status &&
    updatedPerson.managerId
  ) {
    const { resolveManagerSpanExceptions } = await import(
      '@/lib/tolerance-rules/resolve-exceptions'
    )
    // If person became inactive, manager's active report count decreased (might be within threshold now)
    // If person became active, manager's active report count increased (evaluation job will create exceptions if needed)
    // We only resolve if person became inactive (report count decreased)
    if (oldStatus === 'active' && updatedPerson.status === 'inactive') {
      await resolveManagerSpanExceptions(
        user.managerOSOrganizationId,
        updatedPerson.managerId
      )
    }
  }

  // Revalidate the people page
  revalidatePath('/people')

  // Revalidate the person detail page
  revalidatePath(`/people/${id}`)
  revalidatePath('/exceptions')

  // Revalidate job roles if job role was updated
  if (validatedData.jobRoleId !== undefined) {
    // Revalidate the new job role if assigned
    if (updatedPerson.jobRoleId) {
      revalidatePath(`/job-roles/${updatedPerson.jobRoleId}`)
    }
    // Revalidate the old job role if it was changed
    if (oldJobRoleId && oldJobRoleId !== updatedPerson.jobRoleId) {
      revalidatePath(`/job-roles/${oldJobRoleId}`)
    }
  }
}

export async function deletePerson(id: string) {
  const user = await getCurrentUser()

  // Check if user is admin
  if (!isAdminOrOwner(user)) {
    throw new Error('Only organization admins or owners can delete people')
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to delete people')
  }

  // Verify person belongs to user's organization
  const existingPerson = await prisma.person.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
    include: {
      reports: true,
    },
  })
  if (!existingPerson) {
    throw new Error('Person not found or access denied')
  }

  // Check if person has direct reports
  if (existingPerson.reports.length > 0) {
    throw new Error(
      'Cannot delete person with direct reports. Please reassign their reports first.'
    )
  }

  // Delete the person
  await prisma.person.delete({
    where: { id },
  })

  // Revalidate the people page
  revalidatePath('/people')
}

export async function getPerson(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      return null
    }
    return await prisma.person.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
      },
      include: {
        team: true,
        manager: true,
        reports: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  } catch (error) {
    console.error('Error fetching person:', error)
    return null
  }
}

export async function getDirectReports() {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId || !user.managerOSPersonId) {
      return []
    }

    // Get the current user's person record
    const currentPerson = await prisma.person.findUnique({
      where: { id: user.managerOSPersonId },
      include: {
        reports: {
          where: {
            status: 'active',
          },
          include: {
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                birthday: true,
                reports: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    birthday: true,
                  },
                },
              },
            },
            reports: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                birthday: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            jobRole: {
              select: {
                id: true,
                title: true,
                level: true,
                domain: true,
              },
            },
            _count: {
              select: {
                oneOnOnes: true,
                feedback: true,
                tasks: true,
                reports: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    })

    if (!currentPerson) {
      return []
    }

    // Add level field to each report (direct reports are at level 1)
    return currentPerson.reports.map(report => ({
      ...report,
      level: 1,
    }))
  } catch (error) {
    console.error('Error fetching direct reports:', error)
    return []
  }
}

/**
 * Get person data with all relations needed for overview generation
 */
/**
 * Get person summary data for modal display
 * Includes: name, email, role, title, initiatives, and tasks
 */
export async function getPersonSummaryForModal(personId: string) {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      return null
    }

    // Get person basic info
    const person = await prisma.person.findFirst({
      where: {
        id: personId,
        organizationId: user.managerOSOrganizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        jobRole: {
          select: {
            title: true,
          },
        },
      },
    })

    if (!person) {
      return null
    }

    // Get linked account avatars
    let linkedAvatars: { jiraAvatar?: string; githubAvatar?: string } = {}
    try {
      linkedAvatars = await getLinkedAccountAvatars(personId)
    } catch (error) {
      console.error('Error fetching linked account avatars:', error)
      // Continue without linked avatars
    }

    // Get initiatives owned by this person
    const initiatives = await prisma.initiative.findMany({
      where: {
        organizationId: user.managerOSOrganizationId,
        owners: {
          some: { personId },
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        rag: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        updatedAt: true,
        createdAt: true,
        _count: {
          select: {
            objectives: true,
            tasks: true,
            checkIns: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10, // Limit to 10 most recent
    })

    // Get active tasks for this person
    const tasksResult = await getTasksForAssignee(
      personId,
      user.managerOSOrganizationId,
      user.managerOSUserId || '',
      {
        statusFilter: ['todo', 'in_progress'],
        include: {
          assignee: true,
          initiative: true,
          objective: true,
          createdBy: true,
        },
        limit: 10, // Limit to 10 most recent
      }
    )

    // Type assertion: when include options are true, relations will be included
    const tasks = tasksResult as Array<
      (typeof tasksResult)[0] & {
        assignee: { id: string; name: string } | null
        initiative: { id: string; title: string } | null
        objective: { id: string; title: string } | null
        createdBy: { id: string; name: string } | null
      }
    >

    // Get feedback for this person (respects privacy rules)
    let feedback: Array<{
      id: string
      kind: string
      isPrivate: boolean
      body: string
      createdAt: Date
      about: { id: string; name: string }
      from: { id: string; name: string }
      fromId?: string
    }> = []
    try {
      const feedbackData = await getFeedbackForPerson(personId)
      feedback = feedbackData.map(fb => ({
        id: fb.id,
        kind: fb.kind,
        isPrivate: fb.isPrivate,
        body: fb.body,
        createdAt: fb.createdAt,
        about: fb.about,
        from: fb.from,
        fromId: (fb as { fromId?: string }).fromId,
      }))
      // Limit to 5 most recent feedback items
      feedback = feedback.slice(0, 5)
    } catch (error) {
      console.error('Error fetching feedback:', error)
      // Continue without feedback
    }

    return {
      id: person.id,
      name: person.name,
      email: person.email,
      role: person.role,
      title: person.jobRole?.title || null,
      status: person.status,
      avatar: person.avatar,
      jiraAvatar: linkedAvatars.jiraAvatar,
      githubAvatar: linkedAvatars.githubAvatar,
      initiatives: initiatives.map(initiative => ({
        id: initiative.id,
        title: initiative.title,
        description: null,
        status: initiative.status,
        rag: initiative.rag,
        team: initiative.team,
        updatedAt: initiative.updatedAt,
        createdAt: initiative.createdAt,
        _count: initiative._count,
      })),
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId,
        assignee: task.assignee,
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
        initiative: task.initiative,
        objective: task.objective,
        createdBy: task.createdBy,
      })),
      feedback,
    }
  } catch (error) {
    console.error('Error fetching person summary:', error)
    return null
  }
}

export async function getPersonForOverview(
  personId: string,
  organizationId: string,
  currentPersonId: string | null,
  lookbackMs: number
) {
  const person = await prisma.person.findFirst({
    where: { id: personId, organizationId },
    include: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      manager: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      jobRole: {
        include: {
          level: true,
          domain: true,
        },
      },
      reports: {
        where: {
          status: 'active',
        },
        select: {
          id: true,
          name: true,
          role: true,
        },
        orderBy: {
          name: 'asc',
        },
      },
      initiativeOwners: {
        include: {
          initiative: {
            select: {
              id: true,
              title: true,
              summary: true,
              status: true,
              rag: true,
            },
          },
        },
      },
      tasks: {
        where: {
          OR: [
            { status: 'todo' },
            { status: 'doing' },
            { status: 'blocked' },
            {
              AND: [
                { status: 'done' },
                {
                  completedAt: {
                    gte: new Date(Date.now() - lookbackMs),
                  },
                },
              ],
            },
          ],
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 20,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          completedAt: true,
        },
      },
      feedback: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - lookbackMs),
          },
          OR: [
            { isPrivate: false },
            currentPersonId
              ? { AND: [{ isPrivate: true }, { fromId: currentPersonId }] }
              : { id: { equals: '' } }, // no private feedback if no current person
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          kind: true,
          body: true,
          createdAt: true,
          isPrivate: true,
        },
      },
      feedbackCampaigns: {
        where: {
          status: 'completed',
          endDate: {
            gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // Last 6 months
          },
        },
        include: {
          responses: true,
        },
      },
    },
  })

  if (!person) {
    return null
  }

  // Fetch one-on-ones between the target person and their manager (if they have a manager)
  let oneOnOnesWithManager: Array<{
    id: string
    scheduledAt: Date | null
    notes: string | null
  }> = []

  if (person.managerId) {
    // Fetch one-on-ones where the target person is the report and their manager is the manager
    const oneOnOnes = await prisma.oneOnOne.findMany({
      where: {
        reportId: personId,
        managerId: person.managerId,
        scheduledAt: {
          gte: new Date(Date.now() - lookbackMs),
        },
      },
      select: {
        id: true,
        scheduledAt: true,
        notes: true,
      },
      orderBy: {
        scheduledAt: 'desc',
      },
      take: 20, // Limit to most recent 20
    })

    oneOnOnesWithManager = oneOnOnes
  }

  return {
    ...person,
    oneOnOnesWithManager,
  }
}
