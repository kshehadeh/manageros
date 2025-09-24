'use server'

import { prisma } from '@/lib/db'
import { taskSchema, type TaskFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'
import { type TaskStatus } from '@/lib/task-status'
import { taskPriorityUtils, DEFAULT_TASK_PRIORITY } from '@/lib/task-priority'

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
      estimate: validatedData.estimate || null,
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
      OR: [
        { assignee: { organizationId: user.organizationId } },
        { initiative: { organizationId: user.organizationId } },
        { objective: { initiative: { organizationId: user.organizationId } } },
      ],
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
      estimate: validatedData.estimate || null,
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
      OR: [
        { createdBy: { organizationId: user.organizationId } },
        { assignee: { organizationId: user.organizationId } },
        { initiative: { organizationId: user.organizationId } },
        { objective: { initiative: { organizationId: user.organizationId } } },
      ],
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
}

export async function getTasks() {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view tasks')
  }

  const tasks = await prisma.task.findMany({
    where: {
      createdBy: { organizationId: user.organizationId },
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
      createdBy: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

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
      createdBy: { organizationId: user.organizationId },
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

export async function createQuickTask(title: string) {
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

  return task
}

export async function createQuickTaskForInitiative(
  title: string,
  initiativeId: string,
  objectiveId?: string
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
      OR: [
        { assignee: { organizationId: user.organizationId } },
        { initiative: { organizationId: user.organizationId } },
        { objective: { initiative: { organizationId: user.organizationId } } },
      ],
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
      OR: [
        { assignee: { organizationId: user.organizationId } },
        { initiative: { organizationId: user.organizationId } },
        { objective: { initiative: { organizationId: user.organizationId } } },
      ],
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
      OR: [
        { assignee: { organizationId: user.organizationId } },
        { initiative: { organizationId: user.organizationId } },
        { objective: { initiative: { organizationId: user.organizationId } } },
      ],
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
      OR: [
        { assignee: { organizationId: user.organizationId } },
        { initiative: { organizationId: user.organizationId } },
        { objective: { initiative: { organizationId: user.organizationId } } },
      ],
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
  revalidatePath(`/tasks/${taskId}`)

  return task
}

export async function getTasksAssignedToCurrentUser() {
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
      assigneeId: user.personId,
      status: {
        notIn: ['done', 'dropped'], // Only show active tasks
      },
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
      createdBy: true,
    },
    orderBy: [
      { priority: 'asc' }, // Lower number = higher priority
      { dueDate: 'asc' }, // Earlier dates first
      { createdAt: 'desc' }, // Newer tasks first as tiebreaker
    ],
  })

  return tasks
}
