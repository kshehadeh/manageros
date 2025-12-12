import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma'
import { getTaskAccessWhereClause } from '@/lib/task-access-utils'

// Helper function to parse comma-separated values
function parseValues(param: string): string[] {
  return param
    ? param
        .split(',')
        .map(s => s.trim())
        .filter(s => s)
    : []
}

// Helper function to parse comma-separated status values (backward compatibility)
function parseStatusValues(statusParam: string): string[] {
  return parseValues(statusParam)
}

// Helper function to create filter for Prisma (supports single or multiple values)
function createFilter(values: string[]) {
  if (values.length === 0 || values.includes('all')) {
    return undefined
  }
  if (values.length === 1) {
    return values[0]
  }
  return { in: values }
}

// Helper function to create status filter for Prisma (backward compatibility)
function createStatusFilter(statusValues: string[]) {
  return createFilter(statusValues)
}

// Helper function to create status SQL condition
function createStatusSqlCondition(statusValues: string[]) {
  if (statusValues.length === 0 || statusValues.includes('all')) {
    return Prisma.empty
  }
  if (statusValues.length === 1) {
    return Prisma.sql`AND t.status = ${statusValues[0]}`
  }
  return Prisma.sql`AND t.status IN (${Prisma.join(statusValues)})`
}

// Helper function to create assignee SQL condition
function createAssigneeSqlCondition(assigneeValues: string[]) {
  if (assigneeValues.length === 0) {
    return Prisma.empty
  }
  if (assigneeValues.includes('unassigned')) {
    if (assigneeValues.length === 1) {
      return Prisma.sql`AND t."assigneeId" IS NULL`
    }
    const assigneeIds = assigneeValues.filter(id => id !== 'unassigned')
    return Prisma.sql`AND (t."assigneeId" IS NULL OR t."assigneeId" IN (${Prisma.join(assigneeIds)}))`
  }
  if (assigneeValues.length === 1) {
    return Prisma.sql`AND t."assigneeId" = ${assigneeValues[0]}`
  }
  return Prisma.sql`AND t."assigneeId" IN (${Prisma.join(assigneeValues)})`
}

// Helper function to create initiative SQL condition
function createInitiativeSqlCondition(initiativeValues: string[]) {
  if (initiativeValues.length === 0) {
    return Prisma.empty
  }
  if (initiativeValues.includes('no-initiative')) {
    if (initiativeValues.length === 1) {
      return Prisma.sql`AND t."initiativeId" IS NULL`
    }
    const initiativeIds = initiativeValues.filter(id => id !== 'no-initiative')
    return Prisma.sql`AND (t."initiativeId" IS NULL OR t."initiativeId" IN (${Prisma.join(initiativeIds)}))`
  }
  if (initiativeValues.length === 1) {
    return Prisma.sql`AND t."initiativeId" = ${initiativeValues[0]}`
  }
  return Prisma.sql`AND t."initiativeId" IN (${Prisma.join(initiativeValues)})`
}

// Helper function to create priority SQL condition
function createPrioritySqlCondition(priorityValues: string[]) {
  if (priorityValues.length === 0) {
    return Prisma.empty
  }
  const priorities = priorityValues.map(p => parseInt(p)).filter(p => !isNaN(p))
  if (priorities.length === 0) {
    return Prisma.empty
  }
  if (priorities.length === 1) {
    return Prisma.sql`AND t.priority = ${priorities[0]}`
  }
  return Prisma.sql`AND t.priority IN (${Prisma.join(priorities)})`
}

// Helper function to parse sort parameter and build ORDER BY clause
function buildOrderByClause(sortParam: string) {
  if (!sortParam) {
    // Default sorting
    return Prisma.sql`
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
    `
  }

  // Parse comma-separated sort fields
  // Format: "field:direction,field:direction" or just "field,field" (defaults to asc)
  const sortFields = sortParam
    .split(',')
    .map(s => s.trim())
    .filter(s => s)
    .map(field => {
      const [name, direction = 'asc'] = field.split(':')
      return { name: name.trim(), direction: direction.trim().toLowerCase() }
    })

  if (sortFields.length === 0) {
    // If parsing failed, use default
    return Prisma.sql`
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
    `
  }

  // Build ORDER BY clause from parsed fields
  const orderByClauses = sortFields
    .map(({ name, direction }) => {
      const dir = direction === 'desc' ? 'DESC' : 'ASC'

      switch (name.toLowerCase()) {
        case 'status':
          return Prisma.sql`
          CASE t.status
            WHEN 'todo' THEN 1
            WHEN 'doing' THEN 2
            WHEN 'blocked' THEN 3
            WHEN 'done' THEN 4
            WHEN 'dropped' THEN 5
            ELSE 6
          END ${Prisma.raw(dir)}
        `
        case 'duedate':
        case 'due_date':
          return direction === 'desc'
            ? Prisma.sql`t."dueDate" DESC NULLS LAST`
            : Prisma.sql`t."dueDate" ASC NULLS LAST`
        case 'priority':
          return Prisma.sql`t.priority ${Prisma.raw(dir)}`
        case 'assignee':
          return direction === 'desc'
            ? Prisma.sql`a.name DESC NULLS LAST`
            : Prisma.sql`a.name ASC NULLS LAST`
        case 'title':
          return Prisma.sql`t.title ${Prisma.raw(dir)}`
        case 'createdat':
        case 'created_at':
          return Prisma.sql`t."createdAt" ${Prisma.raw(dir)}`
        default:
          // If unknown field, skip it
          return null
      }
    })
    .filter((clause): clause is Prisma.Sql => clause !== null)

  if (orderByClauses.length === 0) {
    // If no valid fields, use default
    return Prisma.sql`
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
    `
  }

  return Prisma.sql`ORDER BY ${Prisma.join(orderByClauses, ', ')}`
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser({ request })
  try {
    // Check if user belongs to an organization
    if (!user.managerOSOrganizationId) {
      return NextResponse.json(
        { error: 'User must belong to an organization to view tasks' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const statusParam = searchParams.get('status') || ''
    const statusValues = parseStatusValues(statusParam)
    const assigneeIdParam = searchParams.get('assigneeId') || ''
    const assigneeIdValues = parseValues(assigneeIdParam)
    const initiativeIdParam = searchParams.get('initiativeId') || ''
    const initiativeIdValues = parseValues(initiativeIdParam)
    const priorityParam = searchParams.get('priority') || ''
    const priorityValues = parseValues(priorityParam)
    const dueDateFrom = searchParams.get('dueDateFrom') || ''
    const dueDateTo = searchParams.get('dueDateTo') || ''
    const sort = searchParams.get('sort') || ''

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
      user.managerOSOrganizationId,
      user.managerOSUserId || '',
      user.managerOSPersonId || undefined
    )

    // Start with base access control and immutable filters
    const filters: Record<string, unknown> = {
      ...whereClause,
    }

    // Apply immutable filters with proper type conversion
    if (immutableFilters.priority) {
      filters.priority = parseInt(immutableFilters.priority as string)
    }
    if (immutableFilters.status) {
      const immutableStatusValues = parseStatusValues(
        immutableFilters.status as string
      )
      const statusFilter = createStatusFilter(immutableStatusValues)
      if (statusFilter !== undefined) {
        filters.status = statusFilter
      }
    }
    if (immutableFilters.assigneeId) {
      filters.assigneeId =
        immutableFilters.assigneeId === 'unassigned'
          ? null
          : immutableFilters.assigneeId
    }
    if (immutableFilters.initiativeId) {
      filters.initiativeId =
        immutableFilters.initiativeId === 'no-initiative'
          ? null
          : immutableFilters.initiativeId
    }
    if (immutableFilters.search) {
      filters.title = {
        contains: immutableFilters.search as string,
        mode: 'insensitive',
      }
    }
    if (immutableFilters.dueDateFrom || immutableFilters.dueDateTo) {
      const dueDateFilter: Record<string, Date> = {}
      if (immutableFilters.dueDateFrom) {
        dueDateFilter.gte = new Date(immutableFilters.dueDateFrom as string)
      }
      if (immutableFilters.dueDateTo) {
        dueDateFilter.lte = new Date(immutableFilters.dueDateTo as string)
      }
      filters.dueDate = dueDateFilter
    }

    // Add user filters (can be overridden by immutable filters)
    if (search && !immutableFilters.search) {
      filters.title = {
        contains: search,
        mode: 'insensitive',
      }
    }

    if (!immutableFilters.status) {
      const statusFilter = createStatusFilter(statusValues)
      if (statusFilter !== undefined) {
        filters.status = statusFilter
      }
    }

    // Build filter conditions for assignee and initiative
    let assigneeCondition: Record<string, unknown> | undefined
    let initiativeCondition: Record<string, unknown> | undefined

    if (assigneeIdValues.length > 0 && !immutableFilters.assigneeId) {
      if (assigneeIdValues.includes('unassigned')) {
        // If "unassigned" is one of the selected values
        if (assigneeIdValues.length === 1) {
          // Only unassigned selected
          assigneeCondition = { assigneeId: null }
        } else {
          // Mix of unassigned and specific assignees - use OR condition
          const assigneeIds = assigneeIdValues.filter(id => id !== 'unassigned')
          assigneeCondition = {
            OR: [{ assigneeId: null }, { assigneeId: { in: assigneeIds } }],
          }
        }
      } else {
        // No "unassigned", just specific assignees
        const assigneeFilter = createFilter(assigneeIdValues)
        if (assigneeFilter !== undefined) {
          assigneeCondition = { assigneeId: assigneeFilter }
        }
      }
    }

    if (initiativeIdValues.length > 0 && !immutableFilters.initiativeId) {
      if (initiativeIdValues.includes('no-initiative')) {
        // If "no-initiative" is one of the selected values
        if (initiativeIdValues.length === 1) {
          // Only no-initiative selected
          initiativeCondition = { initiativeId: null }
        } else {
          // Mix of no-initiative and specific initiatives - use OR condition
          const initiativeIds = initiativeIdValues.filter(
            id => id !== 'no-initiative'
          )
          initiativeCondition = {
            OR: [
              { initiativeId: null },
              { initiativeId: { in: initiativeIds } },
            ],
          }
        }
      } else {
        // No "no-initiative", just specific initiatives
        const initiativeFilter = createFilter(initiativeIdValues)
        if (initiativeFilter !== undefined) {
          initiativeCondition = { initiativeId: initiativeFilter }
        }
      }
    }

    // Combine assignee and initiative conditions with AND logic
    if (assigneeCondition && initiativeCondition) {
      // Both filters are active - combine with AND
      filters.AND = [
        ...((filters.AND as Array<unknown>) || []),
        assigneeCondition,
        initiativeCondition,
      ]
    } else if (assigneeCondition) {
      // Only assignee filter is active
      Object.assign(filters, assigneeCondition)
    } else if (initiativeCondition) {
      // Only initiative filter is active
      Object.assign(filters, initiativeCondition)
    }

    if (priorityValues.length > 0 && !immutableFilters.priority) {
      const priorities = priorityValues
        .map(p => parseInt(p))
        .filter(p => !isNaN(p))
      if (priorities.length === 1) {
        filters.priority = priorities[0]
      } else if (priorities.length > 1) {
        filters.priority = { in: priorities }
      }
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
        -- Tasks associated with initiatives in the same organization
        t."initiativeId" IN (
          SELECT id FROM "Initiative" WHERE "organizationId" = ${user.managerOSOrganizationId}
        )
        -- Tasks associated with objectives of initiatives in the same organization
        OR t."objectiveId" IN (
          SELECT o.id FROM "Objective" o
          JOIN "Initiative" i ON o."initiativeId" = i.id
          WHERE i."organizationId" = ${user.managerOSOrganizationId}
        )
        -- Tasks created by the current user AND creator is in the current organization
        -- (for tasks without initiatives/objectives)
        OR (
          t."createdById" = ${user.managerOSUserId || ''}
          AND t."createdById" IN (
            SELECT "userId" FROM "OrganizationMember" WHERE "organizationId" = ${user.managerOSOrganizationId}
          )
          AND t."initiativeId" IS NULL
          AND t."objectiveId" IS NULL
        )
        ${
          user.managerOSPersonId
            ? Prisma.sql`
        -- Tasks assigned to the current user AND associated with initiatives
        OR (t."assigneeId" = ${user.managerOSPersonId} AND t."initiativeId" IN (
          SELECT id FROM "Initiative" WHERE "organizationId" = ${user.managerOSOrganizationId}
        ))`
            : Prisma.empty
        }
      )
      ${search && !immutableFilters.search ? Prisma.sql`AND t.title ILIKE ${`%${search}%`}` : Prisma.empty}
      ${!immutableFilters.status ? createStatusSqlCondition(statusValues) : Prisma.empty}
      ${!immutableFilters.assigneeId ? createAssigneeSqlCondition(assigneeIdValues) : Prisma.empty}
      ${!immutableFilters.initiativeId ? createInitiativeSqlCondition(initiativeIdValues) : Prisma.empty}
      ${!immutableFilters.priority ? createPrioritySqlCondition(priorityValues) : Prisma.empty}
      ${dueDateFrom && !immutableFilters.dueDate ? Prisma.sql`AND t."dueDate" >= ${new Date(dueDateFrom)}` : Prisma.empty}
      ${dueDateTo && !immutableFilters.dueDate ? Prisma.sql`AND t."dueDate" <= ${new Date(dueDateTo)}` : Prisma.empty}
      ${immutableFilters.search ? Prisma.sql`AND t.title ILIKE ${`%${immutableFilters.search}%`}` : Prisma.empty}
      ${
        immutableFilters.status
          ? createStatusSqlCondition(
              parseStatusValues(immutableFilters.status as string)
            )
          : Prisma.empty
      }
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
      ${buildOrderByClause(sort)}
      LIMIT ${limit} OFFSET ${skip}
    `

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    // Transform raw SQL results to match expected TaskListItem structure
    const transformedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      estimate: null, // Not included in raw query
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assigneeId: task.assigneeId,
      initiativeId: task.initiativeId,
      objectiveId: task.objectiveId,
      createdById: task.createdById,
      assignee:
        task.assigneeId && task.assigneeName
          ? {
              id: task.assigneeId,
              name: task.assigneeName,
            }
          : null,
      initiative:
        task.initiativeId && task.initiativeTitle
          ? {
              id: task.initiativeId,
              title: task.initiativeTitle,
            }
          : null,
      objective: null, // Not included in raw query
      createdBy: {
        id: task.createdById,
        name: task.createdByName || 'Unknown',
      },
    }))

    return NextResponse.json({
      tasks: transformedTasks,
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
