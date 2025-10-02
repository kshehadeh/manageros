import type { Prisma } from '@prisma/client'

export const TASK_LIST_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  estimate: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  assigneeId: true,
  initiativeId: true,
  objectiveId: true,
  createdById: true,
  assignee: {
    select: {
      id: true,
      name: true,
    },
  },
  initiative: {
    select: {
      id: true,
      title: true,
    },
  },
  objective: {
    select: {
      id: true,
      title: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.TaskSelect

export type TaskListItem = Prisma.TaskGetPayload<{
  select: typeof TASK_LIST_SELECT
}>
