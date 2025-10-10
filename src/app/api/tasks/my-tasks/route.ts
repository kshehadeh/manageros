import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

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
      WHERE t."assigneeId" = ${user.personId}
        AND (
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
        ${search ? Prisma.sql`AND t.title ILIKE ${`%${search}%`}` : Prisma.empty}
        ${status && status !== 'all' ? Prisma.sql`AND t.status = ${status}` : Prisma.empty}
        ${excludeCompleted ? Prisma.sql`AND t.status NOT IN ('done', 'dropped')` : Prisma.empty}
        ${
          initiativeId && initiativeId !== 'all'
            ? initiativeId === 'no-initiative'
              ? Prisma.sql`AND t."initiativeId" IS NULL`
              : Prisma.sql`AND t."initiativeId" = ${initiativeId}`
            : Prisma.empty
        }
        ${priority && priority !== 'all' ? Prisma.sql`AND t.priority = ${parseInt(priority)}` : Prisma.empty}
        ${dueDateFrom ? Prisma.sql`AND t."dueDate" >= ${new Date(dueDateFrom)}` : Prisma.empty}
        ${dueDateTo ? Prisma.sql`AND t."dueDate" <= ${new Date(dueDateTo)}` : Prisma.empty}
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
    console.error('Error fetching my tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
