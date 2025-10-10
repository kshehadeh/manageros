import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
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

    // Parse immutable filters from query parameter
    let immutableFilters: Record<string, unknown> = {}
    const immutableFiltersParam = searchParams.get('immutableFilters')
    if (immutableFiltersParam) {
      try {
        immutableFilters = JSON.parse(immutableFiltersParam)
      } catch (error) {
        console.error('Error parsing immutableFilters:', error)
        return NextResponse.json(
          { error: 'Invalid immutableFilters parameter' },
          { status: 400 }
        )
      }
    }

    // Build where clause
    const whereClause = getTaskAccessWhereClause(
      user.organizationId,
      user.id,
      user.personId || undefined
    )

    // Start with base access control and immutable filters
    const filters: Record<string, unknown> = {
      ...whereClause,
      ...immutableFilters, // Immutable filters take precedence
    }

    // Add user filters (can be overridden by immutable filters)
    if (search && !immutableFilters.search) {
      filters.title = {
        contains: search,
        mode: 'insensitive',
      }
    }

    if (status && status !== 'all' && !immutableFilters.status) {
      filters.status = status
    }

    if (assigneeId && assigneeId !== 'all' && !immutableFilters.assigneeId) {
      if (assigneeId === 'unassigned') {
        filters.assigneeId = null
      } else {
        filters.assigneeId = assigneeId
      }
    }

    if (
      initiativeId &&
      initiativeId !== 'all' &&
      !immutableFilters.initiativeId
    ) {
      if (initiativeId === 'no-initiative') {
        filters.initiativeId = null
      } else {
        filters.initiativeId = initiativeId
      }
    }

    if (priority && priority !== 'all' && !immutableFilters.priority) {
      filters.priority = parseInt(priority)
    }

    if ((dueDateFrom || dueDateTo) && !immutableFilters.dueDate) {
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

    // Get tasks with pagination using custom status ordering
    const tasks = await prisma.$queryRaw<
      Array<{
        id: string
        title: string
        description: string | null
        status: string
        priority: number
        dueDate: Date | null
        createdAt: Date
        updatedAt: Date
        objectiveId: string | null
        initiativeId: string | null
        assigneeId: string | null
        createdById: string
        createdByName: string | null
        createdByEmail: string | null
        assigneeName: string | null
        assigneeEmail: string | null
        initiativeTitle: string | null
      }>
    >`
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
        t."createdById" IN (
          SELECT id FROM "User" WHERE "organizationId" = ${user.organizationId}
        )
        OR t."initiativeId" IN (
          SELECT id FROM "Initiative" WHERE "organizationId" = ${user.organizationId}
        )
        OR t."objectiveId" IN (
          SELECT o.id FROM "Objective" o
          JOIN "Initiative" i ON o."initiativeId" = i.id
          WHERE i."organizationId" = ${user.organizationId}
        )
      )
      ${search && !immutableFilters.search ? Prisma.sql`AND t.title ILIKE ${`%${search}%`}` : Prisma.empty}
      ${status && status !== 'all' && !immutableFilters.status ? Prisma.sql`AND t.status = ${status}` : Prisma.empty}
      ${
        assigneeId && assigneeId !== 'all' && !immutableFilters.assigneeId
          ? assigneeId === 'unassigned'
            ? Prisma.sql`AND t."assigneeId" IS NULL`
            : Prisma.sql`AND t."assigneeId" = ${assigneeId}`
          : Prisma.empty
      }
      ${
        initiativeId && initiativeId !== 'all' && !immutableFilters.initiativeId
          ? initiativeId === 'no-initiative'
            ? Prisma.sql`AND t."initiativeId" IS NULL`
            : Prisma.sql`AND t."initiativeId" = ${initiativeId}`
          : Prisma.empty
      }
      ${priority && priority !== 'all' && !immutableFilters.priority ? Prisma.sql`AND t.priority = ${parseInt(priority)}` : Prisma.empty}
      ${dueDateFrom && !immutableFilters.dueDate ? Prisma.sql`AND t."dueDate" >= ${new Date(dueDateFrom)}` : Prisma.empty}
      ${dueDateTo && !immutableFilters.dueDate ? Prisma.sql`AND t."dueDate" <= ${new Date(dueDateTo)}` : Prisma.empty}
      ${immutableFilters.search ? Prisma.sql`AND t.title ILIKE ${`%${immutableFilters.search}%`}` : Prisma.empty}
      ${immutableFilters.status ? Prisma.sql`AND t.status = ${immutableFilters.status}` : Prisma.empty}
      ${
        immutableFilters.assigneeId
          ? immutableFilters.assigneeId === 'unassigned'
            ? Prisma.sql`AND t."assigneeId" IS NULL`
            : Prisma.sql`AND t."assigneeId" = ${immutableFilters.assigneeId}`
          : Prisma.empty
      }
      ${
        immutableFilters.initiativeId
          ? immutableFilters.initiativeId === 'no-initiative'
            ? Prisma.sql`AND t."initiativeId" IS NULL`
            : Prisma.sql`AND t."initiativeId" = ${immutableFilters.initiativeId}`
          : Prisma.empty
      }
      ${immutableFilters.priority ? Prisma.sql`AND t.priority = ${parseInt(immutableFilters.priority as string)}` : Prisma.empty}
      ${
        immutableFilters.dueDate
          ? (() => {
              const dueDateFilter = immutableFilters.dueDate as Record<
                string,
                Date
              >
              let sql = Prisma.empty
              if (dueDateFilter.gte)
                sql = Prisma.sql`AND t."dueDate" >= ${dueDateFilter.gte}`
              if (dueDateFilter.lte)
                sql = Prisma.sql`${sql} AND t."dueDate" <= ${dueDateFilter.lte}`
              return sql
            })()
          : Prisma.empty
      }
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
      LIMIT ${limit} OFFSET ${skip}
    `

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
