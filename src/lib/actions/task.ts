'use server'

import { prisma } from '@/lib/db'
import { taskSchema, type TaskFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'

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
      description: validatedData.description,
      assigneeId: validatedData.assigneeId,
      status: validatedData.status,
      priority: validatedData.priority,
      estimate: validatedData.estimate,
      dueDate,
      initiativeId: validatedData.initiativeId,
      objectiveId: validatedData.objectiveId,
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
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
      description: validatedData.description,
      assigneeId: validatedData.assigneeId,
      status: validatedData.status,
      priority: validatedData.priority,
      estimate: validatedData.estimate,
      dueDate,
      initiativeId: validatedData.initiativeId,
      objectiveId: validatedData.objectiveId,
      completedAt: validatedData.status === 'done' ? new Date() : null,
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
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
      OR: [
        { assignee: { organizationId: user.organizationId } },
        { initiative: { organizationId: user.organizationId } },
        { objective: { initiative: { organizationId: user.organizationId } } },
      ],
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
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
      OR: [
        { assignee: { organizationId: user.organizationId } },
        { initiative: { organizationId: user.organizationId } },
        { objective: { initiative: { organizationId: user.organizationId } } },
      ],
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
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
      priority: 2,
      assigneeId,
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
    },
  })

  // Revalidate the tasks page
  revalidatePath('/tasks')

  return task
}

export async function updateTaskStatus(
  taskId: string,
  status: 'todo' | 'doing' | 'blocked' | 'done' | 'dropped'
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
    },
  })

  // Revalidate the tasks page and task detail page
  revalidatePath('/tasks')
  revalidatePath(`/tasks/${taskId}`)

  return task
}
