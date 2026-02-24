'use server'

import { prisma } from '@/lib/db'
import { taskSchema, type TaskFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'
import { type TaskStatus } from '@/lib/task-status'
import { taskPriorityUtils, DEFAULT_TASK_PRIORITY } from '@/lib/task-priority'
import { getTaskAccessWhereClause } from '@/lib/task-access-utils'
import {
  upsertTaskReminderPreference,
  invalidateDeliveriesForTaskDueDateChange,
} from '@/lib/data/task-reminders'

export async function createTask(formData: TaskFormData) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to create tasks')
  }

  // Validate the form data
  const validatedData = taskSchema.parse(formData)

  // Parse due date if provided
  const dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null

  // Verify assignee belongs to user's organization if specified
  if (validatedData.assigneeId) {
    const assignee = await prisma.person.findFirst({
      where: {
        id: validatedData.assigneeId,
        organizationId: user.managerOSOrganizationId,
      },
    })
    if (!assignee) {
      throw new Error('Assignee not found or access denied')
    }
  }

  // Verify initiative belongs to user's organization if specified
  if (validatedData.initiativeId) {
    const initiative = await prisma.initiative.findFirst({
      where: {
        id: validatedData.initiativeId,
        organizationId: user.managerOSOrganizationId,
      },
    })
    if (!initiative) {
      throw new Error('Initiative not found or access denied')
    }
  }

  // Verify objective belongs to user's organization if specified
  if (validatedData.objectiveId) {
    const objective = await prisma.objective.findFirst({
      where: {
        id: validatedData.objectiveId,
        initiative: {
          organizationId: user.managerOSOrganizationId,
        },
      },
    })
    if (!objective) {
      throw new Error('Objective not found or access denied')
    }
  }

  // Create the task
  const task = await prisma.task.create({
    data: {
      title: validatedData.title,
      description: validatedData.description || null,
      assigneeId: validatedData.assigneeId || null,
      createdById: user.managerOSUserId || '',
      status: validatedData.status,
      priority: validatedData.priority,
      estimate: null,
      dueDate,
      initiativeId: validatedData.initiativeId || null,
      objectiveId: validatedData.objectiveId || null,
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
      createdBy: true,
    },
  })

  // Set reminder preference for the current user if due date and reminder are provided
  const reminderMinutes =
    validatedData.reminderMinutesBeforeDue !== undefined
      ? validatedData.reminderMinutesBeforeDue
      : null
  if (user.managerOSUserId && user.managerOSOrganizationId) {
    const context = {
      userId: user.managerOSUserId,
      organizationId: user.managerOSOrganizationId,
      personId: user.managerOSPersonId ?? undefined,
    }
    if (dueDate && reminderMinutes !== null) {
      await upsertTaskReminderPreference(task.id, context, reminderMinutes)
    } else if (reminderMinutes === null) {
      await upsertTaskReminderPreference(task.id, context, null)
    }
  }

  // Revalidate the tasks page
  revalidatePath('/tasks')
  revalidatePath('/my-tasks')
  // Revalidate layout to update sidebar badge counts
  revalidatePath('/', 'layout')

  // Return the created task
  return task
}

export async function updateTask(taskId: string, formData: TaskFormData) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update tasks')
  }

  // Validate the form data
  const validatedData = taskSchema.parse(formData)

  // Parse due date if provided
  const dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null

  // Verify task belongs to user's organization
  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...getTaskAccessWhereClause(
        user.managerOSOrganizationId,
        user.managerOSUserId || '',
        user.managerOSPersonId || undefined
      ),
    },
  })

  if (!existingTask) {
    throw new Error('Task not found or access denied')
  }

  // Verify assignee belongs to user's organization if specified
  if (validatedData.assigneeId) {
    const assignee = await prisma.person.findFirst({
      where: {
        id: validatedData.assigneeId,
        organizationId: user.managerOSOrganizationId,
      },
    })
    if (!assignee) {
      throw new Error('Assignee not found or access denied')
    }
  }

  // Verify initiative belongs to user's organization if specified
  if (validatedData.initiativeId) {
    const initiative = await prisma.initiative.findFirst({
      where: {
        id: validatedData.initiativeId,
        organizationId: user.managerOSOrganizationId,
      },
    })
    if (!initiative) {
      throw new Error('Initiative not found or access denied')
    }
  }

  // Verify objective belongs to user's organization if specified
  if (validatedData.objectiveId) {
    const objective = await prisma.objective.findFirst({
      where: {
        id: validatedData.objectiveId,
        initiative: {
          organizationId: user.managerOSOrganizationId,
        },
      },
    })
    if (!objective) {
      throw new Error('Objective not found or access denied')
    }
  }

  // Invalidate reminder deliveries if due date changed
  if (
    user.managerOSUserId &&
    user.managerOSOrganizationId &&
    existingTask.dueDate?.getTime() !== dueDate?.getTime()
  ) {
    const context = {
      userId: user.managerOSUserId,
      organizationId: user.managerOSOrganizationId,
      personId: user.managerOSPersonId ?? undefined,
    }
    await invalidateDeliveriesForTaskDueDateChange(taskId, context, dueDate)
  }

  // Update the task
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: validatedData.title,
      description: validatedData.description || null,
      assigneeId: validatedData.assigneeId || null,
      status: validatedData.status,
      priority: validatedData.priority,
      estimate: null,
      dueDate,
      initiativeId: validatedData.initiativeId || null,
      objectiveId: validatedData.objectiveId || null,
      completedAt: validatedData.status === 'done' ? new Date() : null,
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
      createdBy: true,
    },
  })

  // Update reminder preference for the current user
  const reminderMinutes =
    validatedData.reminderMinutesBeforeDue !== undefined
      ? validatedData.reminderMinutesBeforeDue
      : null
  if (user.managerOSUserId && user.managerOSOrganizationId) {
    const context = {
      userId: user.managerOSUserId,
      organizationId: user.managerOSOrganizationId,
      personId: user.managerOSPersonId ?? undefined,
    }
    if (dueDate && reminderMinutes !== null) {
      await upsertTaskReminderPreference(taskId, context, reminderMinutes)
    } else {
      await upsertTaskReminderPreference(taskId, context, reminderMinutes)
    }
  }

  // Revalidate the tasks page and task detail page
  revalidatePath('/tasks')
  revalidatePath('/my-tasks')
  // Revalidate layout to update sidebar badge counts
  revalidatePath('/', 'layout')
  revalidatePath(`/tasks/${taskId}`)

  // Return the updated task
  return task
}

export async function deleteTask(taskId: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to delete tasks')
  }

  // Verify task belongs to user's organization
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...getTaskAccessWhereClause(
        user.managerOSOrganizationId,
        user.managerOSUserId || '',
        user.managerOSPersonId || undefined
      ),
    },
  })

  if (!task) {
    throw new Error('Task not found or access denied')
  }

  // Delete the task
  await prisma.task.delete({
    where: { id: taskId },
  })

  // Revalidate the tasks page
  revalidatePath('/tasks')
  revalidatePath('/my-tasks')
  // Revalidate layout to update sidebar badge counts
  revalidatePath('/', 'layout')
}

export async function getTasksForInitiative(initiativeId: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to view tasks')
  }

  const tasks = await prisma.task.findMany({
    where: {
      initiativeId,
      ...getTaskAccessWhereClause(
        user.managerOSOrganizationId,
        user.managerOSUserId || '',
        user.managerOSPersonId || undefined
      ),
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
      createdBy: true,
    },
    orderBy: [
      { status: 'asc' }, // Show incomplete tasks first
      { dueDate: { sort: 'asc', nulls: 'last' } }, // Then sort by due date
    ],
  })

  return tasks
}

/**
 * Get task completion counts for an initiative (both direct and through objectives)
 * Optimized query that only returns counts, not full task data
 * @param initiativeId The initiative ID
 * @returns Object with total and completed task counts
 */
export async function getInitiativeTaskCompletionCounts(initiativeId: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to view tasks')
  }

  const baseWhere = {
    AND: [
      {
        OR: [{ initiativeId }, { objective: { initiativeId } }],
      },
      {
        OR: [
          { initiative: { organizationId: user.managerOSOrganizationId } },
          {
            objective: {
              initiative: { organizationId: user.managerOSOrganizationId },
            },
          },
        ],
      },
      getTaskAccessWhereClause(
        user.managerOSOrganizationId,
        user.managerOSUserId || '',
        user.managerOSPersonId || undefined
      ),
    ],
  }

  // Get total count
  const total = await prisma.task.count({
    where: baseWhere,
  })

  // Get completed count (status is 'done' or 'dropped')
  const completed = await prisma.task.count({
    where: {
      ...baseWhere,
      status: {
        in: ['done', 'dropped'],
      },
    },
  })

  return {
    total,
    completed,
  }
}

export async function getTask(taskId: string) {
  const user = await getCurrentUser()

  const hasPermission = await getActionPermission(user, 'task.view', taskId)

  if (!hasPermission) {
    throw new Error('You do not have permission to view this task')
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
      createdBy: true,
      reminderPreferences: {
        where: { userId: user.managerOSUserId || '' },
        take: 1,
      },
    },
  })

  return task
}

export async function createQuickTask(
  title: string,
  dueDate?: string,
  priority?: number
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to create tasks')
  }

  if (!user.managerOSUserId) {
    throw new Error('User ID is required to create tasks')
  }

  // Validate the title
  if (!title || title.trim().length === 0) {
    throw new Error('Task title is required')
  }

  if (title.length > 200) {
    throw new Error('Title must be less than 200 characters')
  }

  // Ensure OrganizationMember record exists for the user
  // This is needed for task access control queries to work correctly
  await prisma.organizationMember.upsert({
    where: {
      // eslint-disable-next-line camelcase
      userId_organizationId: {
        userId: user.managerOSUserId,
        organizationId: user.managerOSOrganizationId,
      },
    },
    create: {
      userId: user.managerOSUserId,
      organizationId: user.managerOSOrganizationId,
      role: 'USER', // Deprecated field, but required for schema
    },
    update: {}, // No update needed if record exists
  })

  // Verify the person belongs to the user's organization if user is linked to a person
  let assigneeId = null
  if (user.managerOSPersonId) {
    const person = await prisma.person.findFirst({
      where: {
        id: user.managerOSPersonId,
        organizationId: user.managerOSOrganizationId,
      },
    })

    if (person) {
      assigneeId = user.managerOSPersonId
    }
  }

  // Create the task with defaults
  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      status: 'todo',
      priority: priority || DEFAULT_TASK_PRIORITY,
      assigneeId,
      createdById: user.managerOSUserId,
      dueDate: dueDate || null,
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
      createdBy: true,
    },
  })

  // Revalidate the tasks page
  revalidatePath('/tasks')
  revalidatePath('/my-tasks')
  // Revalidate layout to update sidebar badge counts
  revalidatePath('/', 'layout')

  return task
}

export async function createQuickTaskForInitiative(
  title: string,
  initiativeId: string,
  objectiveId?: string,
  dueDate?: string,
  priority?: number
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to create tasks')
  }

  if (!user.managerOSUserId) {
    throw new Error('User ID is required to create tasks')
  }

  // Validate the title
  if (!title || title.trim().length === 0) {
    throw new Error('Task title is required')
  }

  if (title.length > 200) {
    throw new Error('Title must be less than 200 characters')
  }

  // Ensure OrganizationMember record exists for the user
  // This is needed for task access control queries to work correctly
  await prisma.organizationMember.upsert({
    where: {
      // eslint-disable-next-line camelcase
      userId_organizationId: {
        userId: user.managerOSUserId,
        organizationId: user.managerOSOrganizationId,
      },
    },
    create: {
      userId: user.managerOSUserId,
      organizationId: user.managerOSOrganizationId,
      role: 'USER', // Deprecated field, but required for schema
    },
    update: {}, // No update needed if record exists
  })

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

  // Verify objective belongs to the initiative if specified
  if (objectiveId) {
    const objective = await prisma.objective.findFirst({
      where: {
        id: objectiveId,
        initiativeId: initiativeId,
      },
    })
    if (!objective) {
      throw new Error(
        'Objective not found or does not belong to this initiative'
      )
    }
  }

  // Verify the person belongs to the user's organization if user is linked to a person
  let assigneeId = null
  if (user.managerOSPersonId) {
    const person = await prisma.person.findFirst({
      where: {
        id: user.managerOSPersonId,
        organizationId: user.managerOSOrganizationId,
      },
    })

    if (person) {
      assigneeId = user.managerOSPersonId
    }
  }

  // Create the task with defaults
  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      status: 'todo',
      priority: priority || DEFAULT_TASK_PRIORITY,
      assigneeId,
      createdById: user.managerOSUserId,
      initiativeId,
      objectiveId: objectiveId || null,
      dueDate: dueDate || null,
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
      createdBy: true,
    },
  })

  // Revalidate the tasks page and initiative page
  revalidatePath('/tasks')
  revalidatePath('/my-tasks')
  revalidatePath(`/initiatives/${initiativeId}`)
  // Revalidate layout to update sidebar badge counts
  revalidatePath('/', 'layout')

  return task
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update tasks')
  }

  // Verify task belongs to user's organization
  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...getTaskAccessWhereClause(
        user.managerOSOrganizationId,
        user.managerOSUserId || '',
        user.managerOSPersonId || undefined
      ),
    },
  })

  if (!existingTask) {
    throw new Error('Task not found or access denied')
  }

  // Update only the status and completedAt
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === 'done' ? new Date() : null,
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
      createdBy: true,
    },
  })

  // Revalidate the tasks page and task detail page
  revalidatePath('/tasks')
  revalidatePath('/my-tasks')
  // Revalidate layout to update sidebar badge counts
  revalidatePath('/', 'layout')
  revalidatePath(`/tasks/${taskId}`)

  return task
}

export async function updateTaskTitle(taskId: string, title: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update tasks')
  }

  // Validate the title
  if (!title || title.trim().length === 0) {
    throw new Error('Task title is required')
  }

  if (title.length > 200) {
    throw new Error('Title must be less than 200 characters')
  }

  // Verify task belongs to user's organization
  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...getTaskAccessWhereClause(
        user.managerOSOrganizationId,
        user.managerOSUserId || '',
        user.managerOSPersonId || undefined
      ),
    },
  })

  if (!existingTask) {
    throw new Error('Task not found or access denied')
  }

  // Update only the title
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: title.trim(),
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
      createdBy: true,
    },
  })

  // Revalidate the tasks page and task detail page
  revalidatePath('/tasks')
  revalidatePath('/my-tasks')
  // Revalidate layout to update sidebar badge counts
  revalidatePath('/', 'layout')
  revalidatePath(`/tasks/${taskId}`)

  return task
}

export async function updateTaskPriority(taskId: string, priority: number) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update tasks')
  }

  // Validate the priority
  if (!taskPriorityUtils.isValid(priority)) {
    throw new Error('Priority must be between 1 and 5')
  }

  // Verify task belongs to user's organization
  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...getTaskAccessWhereClause(
        user.managerOSOrganizationId,
        user.managerOSUserId || '',
        user.managerOSPersonId || undefined
      ),
    },
  })

  if (!existingTask) {
    throw new Error('Task not found or access denied')
  }

  // Update only the priority
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      priority,
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
      createdBy: true,
    },
  })

  // Revalidate the tasks page and task detail page
  revalidatePath('/tasks')
  revalidatePath('/my-tasks')
  // Revalidate layout to update sidebar badge counts
  revalidatePath('/', 'layout')
  revalidatePath(`/tasks/${taskId}`)

  return task
}

export async function updateTaskQuickEdit(
  taskId: string,
  updates: {
    title?: string
    description?: string
    assigneeId?: string | null
    dueDate?: string | null
    priority?: number
    status?: string
    reminderMinutesBeforeDue?: number | null
  }
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update tasks')
  }

  // Verify task belongs to user's organization
  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...getTaskAccessWhereClause(
        user.managerOSOrganizationId,
        user.managerOSUserId || '',
        user.managerOSPersonId || undefined
      ),
    },
  })

  if (!existingTask) {
    throw new Error('Task not found or access denied')
  }

  // Verify assignee belongs to user's organization if specified
  if (updates.assigneeId) {
    const assignee = await prisma.person.findFirst({
      where: {
        id: updates.assigneeId,
        organizationId: user.managerOSOrganizationId,
      },
    })
    if (!assignee) {
      throw new Error('Assignee not found or access denied')
    }
  }

  // Parse due date if provided
  const dueDate = updates.dueDate ? new Date(updates.dueDate) : undefined

  // Invalidate reminder deliveries if due date changed
  if (
    user.managerOSUserId &&
    user.managerOSOrganizationId &&
    dueDate !== undefined &&
    existingTask.dueDate?.getTime() !== dueDate.getTime()
  ) {
    const context = {
      userId: user.managerOSUserId,
      organizationId: user.managerOSOrganizationId,
      personId: user.managerOSPersonId ?? undefined,
    }
    await invalidateDeliveriesForTaskDueDateChange(taskId, context, dueDate)
  }

  // Prepare update data
  const updateData: {
    title?: string
    description?: string | null
    assigneeId?: string | null
    priority?: number
    dueDate?: Date
    status?: string
  } = {}
  if (updates.title !== undefined) updateData.title = updates.title
  if (updates.description !== undefined)
    updateData.description = updates.description || null
  if (updates.assigneeId !== undefined)
    updateData.assigneeId = updates.assigneeId
  if (updates.priority !== undefined) updateData.priority = updates.priority
  if (updates.status !== undefined) updateData.status = updates.status
  if (dueDate !== undefined) updateData.dueDate = dueDate

  // Update the task
  const task = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: {
      assignee: true,
      initiative: true,
      objective: true,
      createdBy: true,
    },
  })

  // Update reminder preference when provided
  if (
    updates.reminderMinutesBeforeDue !== undefined &&
    user.managerOSUserId &&
    user.managerOSOrganizationId
  ) {
    const context = {
      userId: user.managerOSUserId,
      organizationId: user.managerOSOrganizationId,
      personId: user.managerOSPersonId ?? undefined,
    }
    await upsertTaskReminderPreference(
      taskId,
      context,
      updates.reminderMinutesBeforeDue ?? null
    )
  }

  // Revalidate the tasks page and task detail page
  revalidatePath('/tasks')
  revalidatePath('/my-tasks')
  // Revalidate layout to update sidebar badge counts
  revalidatePath('/', 'layout')
  revalidatePath(`/tasks/${taskId}`)

  return task
}

export async function updateTaskDescription(
  taskId: string,
  description: string
) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update tasks')
  }

  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...getTaskAccessWhereClause(
        user.managerOSOrganizationId,
        user.managerOSUserId || '',
        user.managerOSPersonId || undefined
      ),
    },
  })

  if (!existingTask) {
    throw new Error('Task not found or access denied')
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      description: description.trim() || null,
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
      createdBy: true,
    },
  })

  revalidatePath('/tasks')
  revalidatePath('/my-tasks')
  revalidatePath(`/tasks/${taskId}`)
  // Revalidate layout to update sidebar badge counts
  revalidatePath('/', 'layout')

  return task
}

export async function updateTaskDueDate(taskId: string, dueDate: Date | null) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update tasks')
  }

  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...getTaskAccessWhereClause(
        user.managerOSOrganizationId,
        user.managerOSUserId || '',
        user.managerOSPersonId || undefined
      ),
    },
  })

  if (!existingTask) {
    throw new Error('Task not found or access denied')
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      dueDate,
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
      createdBy: true,
    },
  })

  revalidatePath('/tasks')
  revalidatePath('/my-tasks')
  revalidatePath(`/tasks/${taskId}`)
  // Revalidate layout to update sidebar badge counts
  revalidatePath('/', 'layout')

  return task
}
