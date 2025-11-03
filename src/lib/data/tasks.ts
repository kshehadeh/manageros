import 'server-only'

import { cache } from 'react'
import { prisma } from '@/lib/db'
import { getTaskAccessWhereClause } from '@/lib/task-access-utils'

export const getTasksForAssignee = cache(
  async (
    assigneeId: string,
    organizationId: string,
    userId: string,
    options?: {
      statusFilter?: Array<'todo' | 'in_progress' | 'done' | 'dropped'>
      excludeStatus?: Array<'todo' | 'in_progress' | 'done' | 'dropped'>
      dueDateBefore?: Date
      dueDateAfter?: Date
      limit?: number
      include?: {
        assignee?: boolean
        initiative?: boolean
        objective?: boolean
        createdBy?: boolean
      }
    }
  ) => {
    const where: Record<string, unknown> = {
      assigneeId,
      ...getTaskAccessWhereClause(organizationId, userId, assigneeId),
    }

    if (options?.statusFilter) {
      where.status = { in: options.statusFilter }
    }

    if (options?.excludeStatus) {
      where.status = { notIn: options.excludeStatus }
    }

    if (options?.dueDateBefore || options?.dueDateAfter) {
      where.dueDate = {
        ...((where.dueDate as Record<string, unknown>) || {}),
        ...(options?.dueDateBefore ? { lt: options.dueDateBefore } : {}),
        ...(options?.dueDateAfter ? { gte: options.dueDateAfter } : {}),
      }
    }

    const include: Record<string, unknown> = {}
    if (options?.include?.assignee) {
      include.assignee = {
        select: {
          id: true,
          name: true,
        },
      }
    }
    if (options?.include?.initiative) {
      include.initiative = {
        select: {
          id: true,
          title: true,
        },
      }
    }
    if (options?.include?.objective) {
      include.objective = {
        select: {
          id: true,
          title: true,
        },
      }
    }
    if (options?.include?.createdBy) {
      include.createdBy = {
        select: {
          id: true,
          name: true,
        },
      }
    }

    return prisma.task.findMany({
      where,
      include: Object.keys(include).length > 0 ? include : undefined,
      orderBy: options?.dueDateBefore
        ? [{ dueDate: { sort: 'asc', nulls: 'last' } }]
        : { updatedAt: 'desc' },
      take: options?.limit,
    })
  }
)

export const getOverdueTasksForAssignee = cache(
  async (
    assigneeId: string,
    organizationId: string,
    userId: string,
    beforeDate?: Date
  ) => {
    const startOfToday = beforeDate || new Date()

    return prisma.task.findMany({
      where: {
        assigneeId,
        dueDate: {
          lt: startOfToday,
        },
        status: {
          notIn: ['done', 'dropped'],
        },
        ...getTaskAccessWhereClause(organizationId, userId, assigneeId),
      },
    })
  }
)
