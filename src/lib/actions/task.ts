'use server'

import { prisma } from '@/lib/db'
import { taskSchema, type TaskFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'
import { type TaskStatus } from '@/lib/task-status'
import { taskPriorityUtils, DEFAULT_TASK_PRIORITY } from '@/lib/task-priority'
import {
  TASK_LIST_SELECT,
  type TaskListItem,
  type ExtendedTaskListItem,
} from '@/lib/task-list-select'
import { getTaskAccessWhereClause } from '@/lib/task-access-utils'
import { Prisma } from '@prisma/client'

export async function createTask(formData: TaskFormData) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
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
        organizationId: user.organizationId,
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
        organizationId: user.organizationId,
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
          organizationId: user.organizationId,
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
      createdById: user.id,
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

  // Revalidate the tasks page
  revalidatePath('/tasks')
  revalidatePath('/my-tasks')

  // Redirect to the new task
  redirect(`/tasks/${task.id}`)
}

export async function updateTask(taskId: string, formData: TaskFormData) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
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
        user.organizationId,
        user.id,
        user.personId || undefined
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
        organizationId: user.organizationId,
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
        organizationId: user.organizationId,
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
          organizationId: user.organizationId,
        },
      },
    })
    if (!objective) {
      throw new Error('Objective not found or access denied')
    }
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

  // Revalidate the tasks page and task detail page
  revalidatePath('/tasks')
  revalidatePath('/my-tasks')
  revalidatePath(`/tasks/${taskId}`)

  // Redirect to the updated task
  redirect(`/tasks/${task.id}`)
}

export async function deleteTask(taskId: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to delete tasks')
  }

  // Verify task belongs to user's organization
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...getTaskAccessWhereClause(
        user.organizationId,
        user.id,
        user.personId || undefined
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
}

export async function getTasks(): Promise<ExtendedTaskListItem[]> {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view tasks')
  }

  // Use raw SQL for custom status ordering
  const tasks = await prisma.$queryRaw<ExtendedTaskListItem[]>`
    SELECT 
      t.id,
      t.title,
      t.description,
      t.status,
      t.priority,
      t."dueDate",
      t."createdAt",
      t."updatedAt",
      t."objectiveId",
      t."initiativeId",
      t."assigneeId",
      t."createdById",
      cb.name as "createdByName",
      cb.email as "createdByEmail",
      a.name as "assigneeName",
      a.email as "assigneeEmail",
      i.title as "initiativeTitle"
    FROM "Task" t
    LEFT JOIN "User" cb ON t."createdById" = cb.id
    LEFT JOIN "Person" a ON t."assigneeId" = a.id
    LEFT JOIN "Initiative" i ON t."initiativeId" = i.id
    WHERE (
      -- Tasks created by the current user
      t."createdById" = ${user.id}
      -- Tasks associated with initiatives in the same organization
      OR t."initiativeId" IN (
        SELECT id FROM "Initiative" WHERE "organizationId" = ${user.organizationId}
      )
      -- Tasks associated with objectives of initiatives in the same organization
      OR t."objectiveId" IN (
        SELECT o.id FROM "Objective" o
        JOIN "Initiative" i ON o."initiativeId" = i.id
        WHERE i."organizationId" = ${user.organizationId}
      )
      ${
        user.personId
          ? Prisma.sql`
      -- Tasks assigned to the current user AND associated with initiatives
      OR (t."assigneeId" = ${user.personId} AND t."initiativeId" IN (
        SELECT id FROM "Initiative" WHERE "organizationId" = ${user.organizationId}
      ))`
          : Prisma.empty
      }
    )
    ORDER BY
      CASE t.status
        WHEN 'todo' THEN 1
        WHEN 'doing' THEN 2
        WHEN 'blocked' THEN 3
        WHEN 'done' THEN 4
        WHEN 'dropped' THEN 5
        ELSE 6
      END,
      t."dueDate" ASC NULLS LAST,
      t."createdAt" ASC
  `

  return tasks
}

export async function getTask(taskId: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view tasks')
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...getTaskAccessWhereClause(
        user.organizationId,
        user.id,
        user.personId || undefined
      ),
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
      createdBy: true,
    },
  })

  return task
}

export async function createQuickTask(title: string, dueDate?: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to create tasks')
  }

  // Validate the title
  if (!title || title.trim().length === 0) {
    throw new Error('Task title is required')
  }

  if (title.length > 200) {
    throw new Error('Title must be less than 200 characters')
  }

  // Verify the person belongs to the user's organization if user is linked to a person
  let assigneeId = null
  if (user.personId) {
    const person = await prisma.person.findFirst({
      where: {
        id: user.personId,
        organizationId: user.organizationId,
      },
    })

    if (person) {
      assigneeId = user.personId
    }
  }

  // Create the task with defaults
  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      status: 'todo',
      priority: DEFAULT_TASK_PRIORITY,
      assigneeId,
      createdById: user.id,
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

  return task
}

export async function createQuickTaskForInitiative(
  title: string,
  initiativeId: string,
  objectiveId?: string,
  dueDate?: string
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to create tasks')
  }

  // Validate the title
  if (!title || title.trim().length === 0) {
    throw new Error('Task title is required')
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
  if (user.personId) {
    const person = await prisma.person.findFirst({
      where: {
        id: user.personId,
        organizationId: user.organizationId,
      },
    })

    if (person) {
      assigneeId = user.personId
    }
  }

  // Create the task with defaults
  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      status: 'todo',
      priority: DEFAULT_TASK_PRIORITY,
      assigneeId,
      createdById: user.id,
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

  return task
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to update tasks')
  }

  // Verify task belongs to user's organization
  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...getTaskAccessWhereClause(
        user.organizationId,
        user.id,
        user.personId || undefined
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
  revalidatePath(`/tasks/${taskId}`)

  return task
}

export async function updateTaskTitle(taskId: string, title: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
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
        user.organizationId,
        user.id,
        user.personId || undefined
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
  revalidatePath(`/tasks/${taskId}`)

  return task
}

export async function updateTaskAssignee(
  taskId: string,
  assigneeId: string | null
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to update tasks')
  }

  // Verify task belongs to user's organization
  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...getTaskAccessWhereClause(
        user.organizationId,
        user.id,
        user.personId || undefined
      ),
    },
  })

  if (!existingTask) {
    throw new Error('Task not found or access denied')
  }

  // Verify assignee belongs to user's organization if specified
  if (assigneeId) {
    const assignee = await prisma.person.findFirst({
      where: {
        id: assigneeId,
        organizationId: user.organizationId,
      },
    })
    if (!assignee) {
      throw new Error('Assignee not found or access denied')
    }
  }

  // Update only the assignee
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      assigneeId,
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
  revalidatePath(`/tasks/${taskId}`)

  return task
}

export async function updateTaskPriority(taskId: string, priority: number) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
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
        user.organizationId,
        user.id,
        user.personId || undefined
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
  }
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to update tasks')
  }

  // Verify task belongs to user's organization
  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...getTaskAccessWhereClause(
        user.organizationId,
        user.id,
        user.personId || undefined
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
        organizationId: user.organizationId,
      },
    })
    if (!assignee) {
      throw new Error('Assignee not found or access denied')
    }
  }

  // Parse due date if provided
  const dueDate = updates.dueDate ? new Date(updates.dueDate) : undefined

  // Prepare update data
  const updateData: {
    title?: string
    description?: string | null
    assigneeId?: string | null
    priority?: number
    dueDate?: Date
  } = {}
  if (updates.title !== undefined) updateData.title = updates.title
  if (updates.description !== undefined)
    updateData.description = updates.description || null
  if (updates.assigneeId !== undefined)
    updateData.assigneeId = updates.assigneeId
  if (updates.priority !== undefined) updateData.priority = updates.priority
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

  // Revalidate the tasks page and task detail page
  revalidatePath('/tasks')
  revalidatePath('/my-tasks')
  revalidatePath(`/tasks/${taskId}`)

  return task
}

export async function getTasksAssignedToCurrentUser(): Promise<TaskListItem[]> {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view tasks')
  }

  // Check if user is linked to a person
  if (!user.personId) {
    return []
  }

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        // Tasks assigned to the current user (respecting organization boundaries)
        {
          assigneeId: user.personId,
          OR: [
            // Tasks created by someone in the user's organization
            {
              createdBy: {
                organizationId: user.organizationId,
              },
            },
            // Tasks associated with initiatives in the user's organization
            {
              initiative: { organizationId: user.organizationId },
            },
            // Tasks associated with objectives of initiatives in the user's organization
            {
              objective: {
                initiative: { organizationId: user.organizationId },
              },
            },
          ],
        },
      ],
      status: {
        notIn: ['done', 'dropped'], // Only show active tasks
      },
    },
    select: TASK_LIST_SELECT,
    orderBy: [
      { priority: 'asc' }, // Lower number = higher priority
      { dueDate: 'asc' }, // Earlier dates first
      { createdAt: 'desc' }, // Newer tasks first as tiebreaker
    ],
  })

  return tasks
}
