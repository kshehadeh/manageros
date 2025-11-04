import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import type { PersonListItem, PeopleResponse } from '@/types/api'

// Helper function to parse comma-separated values
function parseValues(param: string): string[] {
  return param
    ? param
        .split(',')
        .map(s => s.trim())
        .filter(s => s)
    : []
}

// Helper function to create status filter for SQL
function createStatusSqlCondition(statusValues: string[]) {
  if (statusValues.length === 0 || statusValues.includes('all')) {
    return Prisma.empty
  }
  if (statusValues.length === 1) {
    return Prisma.sql`p.status = ${statusValues[0]}`
  }
  return Prisma.sql`p.status IN (${Prisma.join(statusValues)})`
}

// Helper function to parse sort parameter and build ORDER BY clause
function buildOrderByClause(sortParam: string) {
  if (!sortParam) {
    // Default sorting
    return Prisma.sql`ORDER BY p.name ASC`
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
    return Prisma.sql`ORDER BY p.name ASC`
  }

  // Build ORDER BY clause from parsed fields
  const orderByClauses = sortFields
    .map(({ name, direction }) => {
      const dir = direction === 'desc' ? 'DESC' : 'ASC'

      switch (name.toLowerCase()) {
        case 'name':
          return Prisma.sql`p.name ${Prisma.raw(dir)}`
        case 'email':
          return direction === 'desc'
            ? Prisma.sql`p.email DESC NULLS LAST`
            : Prisma.sql`p.email ASC NULLS LAST`
        case 'role':
          return direction === 'desc'
            ? Prisma.sql`p.role DESC NULLS LAST`
            : Prisma.sql`p.role ASC NULLS LAST`
        case 'team':
          return direction === 'desc'
            ? Prisma.sql`t.name DESC NULLS LAST`
            : Prisma.sql`t.name ASC NULLS LAST`
        case 'manager':
          return direction === 'desc'
            ? Prisma.sql`m.name DESC NULLS LAST`
            : Prisma.sql`m.name ASC NULLS LAST`
        case 'status':
          return Prisma.sql`
          CASE p.status
            WHEN 'active' THEN 1
            WHEN 'inactive' THEN 2
            WHEN 'on_leave' THEN 3
            WHEN 'terminated' THEN 4
            ELSE 5
          END ${Prisma.raw(dir)}
        `
        case 'createdat':
        case 'created_at':
          return Prisma.sql`p."createdAt" ${Prisma.raw(dir)}`
        default:
          // If unknown field, skip it
          return null
      }
    })
    .filter((clause): clause is Prisma.Sql => clause !== null)

  if (orderByClauses.length === 0) {
    // If no valid fields, use default
    return Prisma.sql`ORDER BY p.name ASC`
  }

  return Prisma.sql`ORDER BY ${Prisma.join(orderByClauses, ', ')}`
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  try {
    // Check if user belongs to an organization
    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'User must belong to an organization to view people' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const teamId = searchParams.get('teamId') || ''
    const managerId = searchParams.get('managerId') || ''
    const jobRoleId = searchParams.get('jobRoleId') || ''
    const statusParam = searchParams.get('status') || ''
    const statusValues = parseValues(statusParam)
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
      Prisma.sql`p."organizationId" = ${user.organizationId}`,
    ]

    // Apply search filter (immutable takes precedence)
    const searchTerm = (immutableFilters.search as string) || search
    if (searchTerm) {
      whereConditions.push(
        Prisma.sql`(
          p.name ILIKE ${`%${searchTerm}%`} OR 
          p.email ILIKE ${`%${searchTerm}%`} OR 
          p.role ILIKE ${`%${searchTerm}%`}
        )`
      )
    }

    // Apply team filter (immutable takes precedence)
    const teamFilter = (immutableFilters.teamId as string) || teamId
    if (teamFilter && teamFilter !== 'all') {
      if (teamFilter === 'no-team') {
        whereConditions.push(Prisma.sql`p."teamId" IS NULL`)
      } else {
        whereConditions.push(Prisma.sql`p."teamId" = ${teamFilter}`)
      }
    }

    // Apply manager filter (immutable takes precedence)
    const managerFilter = (immutableFilters.managerId as string) || managerId
    if (managerFilter && managerFilter !== 'all') {
      if (managerFilter === 'no-manager') {
        whereConditions.push(Prisma.sql`p."managerId" IS NULL`)
      } else {
        whereConditions.push(Prisma.sql`p."managerId" = ${managerFilter}`)
      }
    }

    // Apply job role filter (immutable takes precedence)
    const jobRoleFilter = (immutableFilters.jobRoleId as string) || jobRoleId
    if (jobRoleFilter && jobRoleFilter !== 'all') {
      if (jobRoleFilter === 'no-role') {
        whereConditions.push(Prisma.sql`p."jobRoleId" IS NULL`)
      } else {
        whereConditions.push(Prisma.sql`p."jobRoleId" = ${jobRoleFilter}`)
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
      FROM "Person" p
      ${whereClause}
    `
    const totalCount = Number(countResult[0]?.count || 0)

    // Build ORDER BY clause
    const orderByClause = buildOrderByClause(sort)

    // Get people with pagination
    const peopleRaw = await prisma.$queryRaw<
      Array<{
        id: string
        name: string
        email: string | null
        role: string | null
        status: string
        avatar: string | null
        startedAt: Date | null
        teamId: string | null
        managerId: string | null
        jobRoleId: string | null
        organizationId: string
        createdAt: Date
        updatedAt: Date
        teamName: string | null
        managerName: string | null
        jobRoleTitle: string | null
        reportCount: bigint
      }>
    >`
      SELECT 
        p.id,
        p.name,
        p.email,
        p.role,
        p.status,
        p.avatar,
        p."startedAt",
        p."teamId",
        p."managerId",
        p."jobRoleId",
        p."organizationId",
        p."createdAt",
        p."updatedAt",
        t.name as "teamName",
        m.name as "managerName",
        jr.title as "jobRoleTitle",
        (SELECT COUNT(*)::int FROM "Person" r WHERE r."managerId" = p.id) as "reportCount"
      FROM "Person" p
      LEFT JOIN "Team" t ON p."teamId" = t.id
      LEFT JOIN "Person" m ON p."managerId" = m.id
      LEFT JOIN "JobRole" jr ON p."jobRoleId" = jr.id
      ${whereClause}
      ${orderByClause}
      LIMIT ${limit}
      OFFSET ${skip}
    `

    // Convert bigint to number for reportCount and map field names
    const people: PersonListItem[] = peopleRaw.map(person => ({
      id: person.id,
      name: person.name,
      email: person.email,
      role: person.role,
      status: person.status,
      avatarUrl: person.avatar, // Map avatar to avatarUrl
      startDate: person.startedAt, // Map startedAt to startDate
      endDate: null, // Person model doesn't have endDate
      teamId: person.teamId,
      managerId: person.managerId,
      jobRoleId: person.jobRoleId,
      organizationId: person.organizationId,
      userId: null, // Person model doesn't have userId field
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
      teamName: person.teamName,
      managerName: person.managerName,
      jobRoleTitle: person.jobRoleTitle,
      reportCount: Number(person.reportCount),
    }))

    const response: PeopleResponse = {
      people,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching people:', error)
    return NextResponse.json(
      { error: 'Failed to fetch people' },
      { status: 500 }
    )
  }
}
