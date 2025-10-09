import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { TASK_LIST_SELECT } from '@/lib/task-list-select'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    // Check if user belongs to an organization
    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'User must belong to an organization to view tasks' },
        { status: 403 }
      )
    }

    // Check if user is linked to a person
    if (!user.personId) {
      return NextResponse.json({
        tasks: [],
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const initiativeId = searchParams.get('initiativeId') || ''
    const priority = searchParams.get('priority') || ''
    const dueDateFrom = searchParams.get('dueDateFrom') || ''
    const dueDateTo = searchParams.get('dueDateTo') || ''
    const excludeCompleted = searchParams.get('excludeCompleted') === 'true'

    // Build where clause for tasks assigned to current user
    const filters: Record<string, unknown> = {
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
    }

    // Add additional filters
    if (search) {
      filters.title = {
        contains: search,
        mode: 'insensitive',
      }
    }

    if (status && status !== 'all') {
      filters.status = status
    }

    // Add completed tasks filter
    if (excludeCompleted) {
      filters.status = {
        notIn: ['done', 'dropped'],
      }
    }

    if (initiativeId && initiativeId !== 'all') {
      if (initiativeId === 'no-initiative') {
        filters.initiativeId = null
      } else {
        filters.initiativeId = initiativeId
      }
    }

    if (priority && priority !== 'all') {
      filters.priority = parseInt(priority)
    }

    if (dueDateFrom || dueDateTo) {
      const dueDateFilter: Record<string, Date> = {}
      if (dueDateFrom) {
        dueDateFilter.gte = new Date(dueDateFrom)
      }
      if (dueDateTo) {
        dueDateFilter.lte = new Date(dueDateTo)
      }
      filters.dueDate = dueDateFilter
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get total count for pagination
    const totalCount = await prisma.task.count({
      where: filters,
    })

    // Get tasks with pagination
    const tasks = await prisma.task.findMany({
      where: filters,
      select: TASK_LIST_SELECT,
      orderBy: [
        { priority: 'asc' }, // Lower number = higher priority
        { dueDate: 'asc' }, // Earlier dates first
        { createdAt: 'desc' }, // Newer tasks first as tiebreaker
      ],
      skip,
      take: limit,
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    })
  } catch (error) {
    console.error('Error fetching my tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
