import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export const tasksTool = {
  description:
    'Get information about tasks in the organization. Use this to find what tasks someone is working on or has worked on.',
  parameters: z.object({
    status: z
      .enum(['todo', 'doing', 'blocked', 'done', 'dropped'])
      .optional()
      .describe('Filter by task status'),
    priority: z.number().optional().describe('Filter by task priority (1-4)'),
    assigneeId: z.string().optional().describe('Filter by assigned person ID'),
    initiativeId: z.string().optional().describe('Filter by initiative ID'),
    query: z
      .string()
      .optional()
      .describe('Search query to filter tasks by title or description'),
    updatedAfter: z
      .string()
      .optional()
      .describe('ISO date string - only show tasks updated after this date'),
    updatedBefore: z
      .string()
      .optional()
      .describe('ISO date string - only show tasks updated before this date'),
  }),
  execute: async ({
    status,
    priority,
    assigneeId,
    initiativeId,
    query,
    updatedAfter,
    updatedBefore,
  }: {
    status?: string
    priority?: number
    assigneeId?: string
    initiativeId?: string
    query?: string
    updatedAfter?: string
    updatedBefore?: string
  }) => {
    console.log('🔧 tasksTool called with parameters:', {
      status,
      priority,
      assigneeId,
      initiativeId,
      query,
      updatedAfter,
      updatedBefore,
    })
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      throw new Error('User must belong to an organization')
    }

    const whereClause: Prisma.TaskWhereInput = {
      OR: [
        {
          createdBy: {
            id: user.managerOSUserId,
          },
        },
        { initiative: { organizationId: user.managerOSOrganizationId } },
        {
          objective: {
            initiative: { organizationId: user.managerOSOrganizationId },
          },
        },
      ],
    }

    if (status) whereClause.status = status
    if (priority) whereClause.priority = priority
    if (assigneeId) whereClause.assigneeId = assigneeId
    if (initiativeId) whereClause.initiativeId = initiativeId

    // Date filters
    if (updatedAfter || updatedBefore) {
      whereClause.updatedAt = {}
      if (updatedAfter) {
        whereClause.updatedAt.gte = new Date(updatedAfter)
      }
      if (updatedBefore) {
        whereClause.updatedAt.lte = new Date(updatedBefore)
      }
    }

    if (query) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
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
            initiative: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return {
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assignee: task.assignee?.name,
        initiative: task.initiative?.title,
        objective: task.objective?.title,
        createdBy: task.createdBy?.name,
        completedAt: task.completedAt,
      })),
    }
  },
}
