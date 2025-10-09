import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { TASK_LIST_SELECT } from '@/lib/task-list-select'
import { getTaskAccessWhereClause } from '@/lib/task-access-utils'

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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const assigneeId = searchParams.get('assigneeId') || ''
    const initiativeId = searchParams.get('initiativeId') || ''
    const priority = searchParams.get('priority') || ''
    const dueDateFrom = searchParams.get('dueDateFrom') || ''
    const dueDateTo = searchParams.get('dueDateTo') || ''

    // Build where clause
    const whereClause = getTaskAccessWhereClause(
      user.organizationId,
      user.id,
      user.personId || undefined
    )

    // Add filters
    const filters: Record<string, unknown> = {
      ...whereClause,
    }

    if (search) {
      filters.title = {
        contains: search,
        mode: 'insensitive',
      }
    }

    if (status && status !== 'all') {
      filters.status = status
    }

    if (assigneeId && assigneeId !== 'all') {
      if (assigneeId === 'unassigned') {
        filters.assigneeId = null
      } else {
        filters.assigneeId = assigneeId
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
      orderBy: { updatedAt: 'desc' },
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
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
