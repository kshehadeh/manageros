import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Helper function to parse comma-separated values
function parseValues(param: string): string[] {
  return param
    ? param
        .split(',')
        .map(s => s.trim())
        .filter(s => s)
    : []
}

// Helper function to create RAG filter for SQL
function createRagSqlCondition(ragValues: string[]) {
  if (ragValues.length === 0 || ragValues.includes('all')) {
    return Prisma.empty
  }
  if (ragValues.length === 1) {
    return Prisma.sql`i.rag = ${ragValues[0]}`
  }
  return Prisma.sql`i.rag IN (${Prisma.join(ragValues)})`
}

// Helper function to create status filter for SQL
function createStatusSqlCondition(statusValues: string[]) {
  if (statusValues.length === 0 || statusValues.includes('all')) {
    return Prisma.empty
  }
  if (statusValues.length === 1) {
    return Prisma.sql`i.status = ${statusValues[0]}`
  }
  return Prisma.sql`i.status IN (${Prisma.join(statusValues)})`
}

// Helper function to parse sort parameter and build ORDER BY clause
function buildOrderByClause(sortParam: string) {
  if (!sortParam) {
    // Default sorting
    return Prisma.sql`ORDER BY i."updatedAt" DESC`
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
    return Prisma.sql`ORDER BY i."updatedAt" DESC`
  }

  // Build ORDER BY clause from parsed fields
  const orderByClauses = sortFields
    .map(({ name, direction }) => {
      const dir = direction === 'desc' ? 'DESC' : 'ASC'

      switch (name.toLowerCase()) {
        case 'title':
          // Case-insensitive alphabetical sort by title
          return Prisma.sql`LOWER(i.title) ${Prisma.raw(dir)}`
        case 'status':
          return Prisma.sql`i.status ${Prisma.raw(dir)}`
        case 'rag':
          return Prisma.sql`
          CASE i.rag
            WHEN 'red' THEN 1
            WHEN 'amber' THEN 2
            WHEN 'green' THEN 3
            ELSE 4
          END ${Prisma.raw(dir)}
        `
        case 'team':
          return direction === 'desc'
            ? Prisma.sql`t.name DESC NULLS LAST`
            : Prisma.sql`t.name ASC NULLS LAST`
        case 'targetdate':
        case 'target_date':
          return direction === 'desc'
            ? Prisma.sql`i."targetDate" DESC NULLS LAST`
            : Prisma.sql`i."targetDate" ASC NULLS LAST`
        case 'createdat':
        case 'created_at':
          return Prisma.sql`i."createdAt" ${Prisma.raw(dir)}`
        case 'updatedat':
        case 'updated_at':
          return Prisma.sql`i."updatedAt" ${Prisma.raw(dir)}`
        default:
          // If unknown field, skip it
          return null
      }
    })
    .filter((clause): clause is Prisma.Sql => clause !== null)

  if (orderByClauses.length === 0) {
    // If no valid fields, use default
    return Prisma.sql`ORDER BY i."updatedAt" DESC`
  }

  return Prisma.sql`ORDER BY ${Prisma.join(orderByClauses, ', ')}`
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  try {
    // Check if user belongs to an organization
    if (!user.managerOSOrganizationId) {
      return NextResponse.json(
        { error: 'User must belong to an organization to view initiatives' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const teamId = searchParams.get('teamId') || ''
    const ownerId = searchParams.get('ownerId') || ''
    const ragParam = searchParams.get('rag') || ''
    const ragValues = parseValues(ragParam)
    const statusParam = searchParams.get('status') || ''
    const statusValues = parseValues(statusParam)
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
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

    // Build where conditions for SQL query
    const whereConditions: Prisma.Sql[] = [
      Prisma.sql`i."organizationId" = ${user.managerOSOrganizationId}`,
    ]

    // Apply search filter (immutable takes precedence)
    const searchTerm = (immutableFilters.search as string) || search
    if (searchTerm) {
      whereConditions.push(Prisma.sql`i.title ILIKE ${`%${searchTerm}%`}`)
    }

    // Apply team filter (immutable takes precedence)
    const teamFilter = (immutableFilters.teamId as string) || teamId
    if (teamFilter && teamFilter !== 'all') {
      if (teamFilter === 'no-team') {
        whereConditions.push(Prisma.sql`i."teamId" IS NULL`)
      } else {
        whereConditions.push(Prisma.sql`i."teamId" = ${teamFilter}`)
      }
    }

    // Apply RAG filter (immutable takes precedence)
    const ragFilter = immutableFilters.rag
      ? parseValues(immutableFilters.rag as string)
      : ragValues
    if (ragFilter.length > 0 && !ragFilter.includes('all')) {
      const ragCondition = createRagSqlCondition(ragFilter)
      if (ragCondition !== Prisma.empty) {
        whereConditions.push(ragCondition)
      }
    }

    // Apply status filter (immutable takes precedence)
    const statusFilter = immutableFilters.status
      ? parseValues(immutableFilters.status as string)
      : statusValues
    if (statusFilter.length > 0 && !statusFilter.includes('all')) {
      const statusCondition = createStatusSqlCondition(statusFilter)
      if (statusCondition !== Prisma.empty) {
        whereConditions.push(statusCondition)
      }
    }

    // Apply date filters (immutable takes precedence)
    const dateFromFilter = (immutableFilters.dateFrom as string) || dateFrom
    const dateToFilter = (immutableFilters.dateTo as string) || dateTo
    if (dateFromFilter) {
      whereConditions.push(
        Prisma.sql`i."targetDate" >= ${new Date(dateFromFilter)}`
      )
    }
    if (dateToFilter) {
      whereConditions.push(
        Prisma.sql`i."targetDate" <= ${new Date(dateToFilter)}`
      )
    }

    // Apply owner filter (immutable takes precedence) - must be in WHERE clause for correct pagination
    const ownerFilter = (immutableFilters.ownerId as string) || ownerId
    const hasOwnerFilter = ownerFilter && ownerFilter !== 'all'
    if (hasOwnerFilter) {
      whereConditions.push(
        Prisma.sql`EXISTS (
          SELECT 1 FROM "InitiativeOwner" io 
          WHERE io."initiativeId" = i.id 
          AND io."personId" = ${ownerFilter}
        )`
      )
    }

    // Build WHERE clause
    const whereClause =
      whereConditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}`
        : Prisma.empty

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get total count for pagination
    const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count
      FROM "Initiative" i
      ${whereClause}
    `
    const totalCount = Number(countResult[0]?.count || 0)

    // Get initiatives with pagination
    const initiatives = await prisma.$queryRaw<
      Array<{
        id: string
        title: string
        summary: string | null
        outcome: string | null
        status: string
        rag: string
        confidence: number
        startDate: Date | null
        targetDate: Date | null
        createdAt: Date
        updatedAt: Date
        teamId: string | null
        teamName: string | null
        organizationId: string
      }>
    >`
      SELECT 
        i.id,
        i.title,
        i.summary,
        i.outcome,
        i.status,
        i.rag,
        i.confidence,
        i."startDate",
        i."targetDate",
        i."createdAt",
        i."updatedAt",
        i."teamId",
        t.name as "teamName",
        i."organizationId"
      FROM "Initiative" i
      LEFT JOIN "Team" t ON i."teamId" = t.id
      ${whereClause}
      ${buildOrderByClause(sort)}
      LIMIT ${limit} OFFSET ${skip}
    `

    // Now fetch related data for each initiative
    const initiativeIds = initiatives.map(i => i.id)

    // If no initiatives, skip related data fetching
    let objectives: Array<{
      id: string
      title: string
      initiativeId: string
      sortIndex: number
    }> = []
    let owners: Array<{
      initiativeId: string
      personId: string
      person: { id: string; name: string }
    }> = []
    let taskCounts: Array<{
      initiativeId: string
      taskCount: bigint
      completedCount: bigint
    }> = []
    let checkInCounts: Array<{ initiativeId: string; checkInCount: bigint }> =
      []

    if (initiativeIds.length > 0) {
      // Fetch objectives
      objectives = await prisma.objective.findMany({
        where: {
          initiativeId: { in: initiativeIds },
        },
        orderBy: { sortIndex: 'asc' },
      })

      // Fetch owners with person data
      owners = await prisma.initiativeOwner.findMany({
        where: {
          initiativeId: { in: initiativeIds },
        },
        include: {
          person: true,
        },
      })

      // Fetch task counts and check-in counts
      taskCounts = await prisma.$queryRaw<
        Array<{
          initiativeId: string
          taskCount: bigint
          completedCount: bigint
        }>
      >`
        SELECT 
          "initiativeId",
          COUNT(*)::int as "taskCount",
          SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END)::int as "completedCount"
        FROM "Task"
        WHERE "initiativeId" IN (${Prisma.join(initiativeIds)})
        GROUP BY "initiativeId"
      `

      checkInCounts = await prisma.$queryRaw<
        Array<{ initiativeId: string; checkInCount: bigint }>
      >`
        SELECT 
          "initiativeId",
          COUNT(*)::int as "checkInCount"
        FROM "CheckIn"
        WHERE "initiativeId" IN (${Prisma.join(initiativeIds)})
        GROUP BY "initiativeId"
      `
    }

    // Build the response with all relations (owner filter already applied in SQL)
    const enrichedInitiatives = initiatives.map(initiative => {
      const initiativeObjectives = objectives.filter(
        o => o.initiativeId === initiative.id
      )
      const initiativeOwners = owners.filter(
        o => o.initiativeId === initiative.id
      )
      const taskCount =
        taskCounts.find(tc => tc.initiativeId === initiative.id)?.taskCount || 0
      const completedTaskCount =
        taskCounts.find(tc => tc.initiativeId === initiative.id)
          ?.completedCount || 0
      const checkInCount =
        checkInCounts.find(cc => cc.initiativeId === initiative.id)
          ?.checkInCount || 0

      return {
        ...initiative,
        objectives: initiativeObjectives,
        owners: initiativeOwners,
        team: initiative.teamId
          ? { id: initiative.teamId, name: initiative.teamName }
          : null,
        _count: {
          tasks: Number(taskCount),
          checkIns: Number(checkInCount),
        },
        tasks: Array(Number(taskCount))
          .fill(null)
          .map((_, i) => ({
            status: i < Number(completedTaskCount) ? 'done' : 'todo',
          })),
      }
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      initiatives: enrichedInitiatives,
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
    console.error('Error fetching initiatives:', error)
    return NextResponse.json(
      { error: 'Failed to fetch initiatives' },
      { status: 500 }
    )
  }
}
