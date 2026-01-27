import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import type { Prisma } from '@/generated/prisma'

export const tasksTool = {
  description:
    'Get information about tasks in the organization. Use this to find what tasks someone is working on or has worked on. It uses things like status, priority, assignee, initiative, and keywords to filter the list. The tasks returned are limited to this filter. The response includes a createdBy field (when available) which represents the person who created the task; use it when the user asks about the task\'s creator. Use this tool with each new query as opposed to using previous responses for future queries. IMPORTANT: When the user asks about "my tasks", "tasks I\'m working on", or anything related to their own tasks, FIRST use the currentUser tool to get the current user\'s person ID, then use this tool with that personId parameter.',
  parameters: z.object({
    status: z
      .enum(['todo', 'doing', 'blocked', 'done', 'dropped', 'not-specified'])
      .optional()
      .describe('Filter by task status - not-specified means no status filter'),
    priority: z
      .number()
      .optional()
      .describe('Filter by task priority (1-4) - 0 means no priority filter'),
    assigneeId: z
      .string()
      .optional()
      .describe(
        'Filter by assigned person ID - not-specified means no assignee filter'
      ),
    initiativeId: z.string().optional().describe('Filter by initiative ID'),
    query: z
      .string()
      .optional()
      .describe(
        'Search query to filter tasks by title or description - not-specified means no search filter'
      ),
    updatedAfter: z
      .string()
      .optional()
      .describe(
        'ISO date string - only show tasks updated after this date - not-specified means no updated after filter'
      ),
    updatedBefore: z
      .string()
      .optional()
      .describe(
        'ISO date string - only show tasks updated before this date - not-specified means no updated before filter'
      ),
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

    if (status && status !== 'not-specified') whereClause.status = status
    if (priority !== undefined && priority !== 0)
      whereClause.priority = priority
    if (assigneeId && assigneeId !== 'not-specified')
      whereClause.assigneeId = assigneeId
    if (initiativeId && initiativeId !== 'not-specified')
      whereClause.initiativeId = initiativeId

    // Date filters
    if (updatedAfter && updatedBefore) {
      whereClause.updatedAt = {}
      if (updatedAfter && updatedAfter !== 'not-specified') {
        whereClause.updatedAt.gte = new Date(updatedAfter)
      }
      if (updatedBefore && updatedBefore !== 'not-specified') {
        whereClause.updatedAt.lte = new Date(updatedBefore)
      }
    }

    if (query && query !== '' && query !== 'not-specified') {
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
