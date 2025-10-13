import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Helper function to parse sort parameter and build ORDER BY clause
function buildOrderByClause(sortParam: string) {
  if (!sortParam) {
    // Default sorting
    return Prisma.sql`ORDER BY t.name ASC`
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
    return Prisma.sql`ORDER BY t.name ASC`
  }

  // Build ORDER BY clause from parsed fields
  const orderByClauses = sortFields
    .map(({ name, direction }) => {
      const dir = direction === 'desc' ? 'DESC' : 'ASC'

      switch (name.toLowerCase()) {
        case 'name':
          return Prisma.sql`t.name ${Prisma.raw(dir)}`
        case 'createdat':
        case 'created_at':
          return Prisma.sql`t."createdAt" ${Prisma.raw(dir)}`
        case 'updatedat':
        case 'updated_at':
          return Prisma.sql`t."updatedAt" ${Prisma.raw(dir)}`
        default:
          // If unknown field, skip it
          return null
      }
    })
    .filter((clause): clause is Prisma.Sql => clause !== null)

  if (orderByClauses.length === 0) {
    // If no valid fields, use default
    return Prisma.sql`ORDER BY t.name ASC`
  }

  return Prisma.sql`ORDER BY ${Prisma.join(orderByClauses, ', ')}`
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    // Check if user belongs to an organization
    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'User must belong to an organization to view teams' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const parentId = searchParams.get('parentId') || ''
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

    // Get the current user's person record for filtering
    const currentPerson = await prisma.person.findFirst({
      where: {
        user: { id: user.id },
        organizationId: user.organizationId,
      },
    })

    // Build where conditions for SQL query
    const whereConditions: Prisma.Sql[] = [
      Prisma.sql`t."organizationId" = ${user.organizationId}`,
    ]

    // Apply search filter (immutable takes precedence)
    const searchTerm = (immutableFilters.search as string) || search
    if (searchTerm) {
      whereConditions.push(Prisma.sql`t.name ILIKE ${`%${searchTerm}%`}`)
    }

    // Apply parent filter (immutable takes precedence)
    const parentFilter = (immutableFilters.parentId as string) || parentId
    if (parentFilter && parentFilter !== 'all') {
      if (parentFilter === 'no-parent') {
        whereConditions.push(Prisma.sql`t."parentId" IS NULL`)
      } else {
        whereConditions.push(Prisma.sql`t."parentId" = ${parentFilter}`)
      }
    }

    // Special filter: teams where user is a member or manages people (for related teams)
    const relatedToUser = immutableFilters.relatedToUser as string
    if (relatedToUser && currentPerson) {
      // Get all people managed by the current user (recursive)
      const managedPeople = await prisma.$queryRaw<Array<{ id: string }>>`
        WITH RECURSIVE managed_people AS (
          -- Base case: direct reports
          SELECT id FROM "Person" WHERE "managerId" = ${currentPerson.id}
          UNION
          -- Recursive case: reports of reports
          SELECT p.id FROM "Person" p
          INNER JOIN managed_people mp ON p."managerId" = mp.id
        )
        SELECT id FROM managed_people
      `
      const managedPersonIds = managedPeople.map(p => p.id)

      // Filter teams that include current user or any managed person
      if (managedPersonIds.length > 0) {
        whereConditions.push(
          Prisma.sql`EXISTS (
            SELECT 1 FROM "Person" p 
            WHERE p."teamId" = t.id 
            AND (p.id = ${currentPerson.id} OR p.id IN (${Prisma.join(managedPersonIds)}))
          )`
        )
      } else {
        whereConditions.push(
          Prisma.sql`EXISTS (
            SELECT 1 FROM "Person" p 
            WHERE p."teamId" = t.id 
            AND p.id = ${currentPerson.id}
          )`
        )
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
      FROM "Team" t
      ${whereClause}
    `
    const totalCount = Number(countResult[0]?.count || 0)

    // Get teams with pagination
    const teams = await prisma.$queryRaw<
      Array<{
        id: string
        name: string
        description: string | null
        parentId: string | null
        organizationId: string
        createdAt: Date
        updatedAt: Date
        parentName: string | null
      }>
    >`
      SELECT 
        t.id,
        t.name,
        t.description,
        t."parentId",
        t."organizationId",
        t."createdAt",
        t."updatedAt",
        parent.name as "parentName"
      FROM "Team" t
      LEFT JOIN "Team" parent ON t."parentId" = parent.id
      ${whereClause}
      ${buildOrderByClause(sort)}
      LIMIT ${limit} OFFSET ${skip}
    `

    // Fetch related data for each team
    const teamIds = teams.map(t => t.id)

    let peopleCounts: Array<{ teamId: string; peopleCount: bigint }> = []
    let initiativesCounts: Array<{
      teamId: string
      initiativesCount: bigint
    }> = []

    if (teamIds.length > 0) {
      peopleCounts = await prisma.$queryRaw<
        Array<{ teamId: string; peopleCount: bigint }>
      >`
        SELECT 
          "teamId",
          COUNT(*)::int as "peopleCount"
        FROM "Person"
        WHERE "teamId" IN (${Prisma.join(teamIds)})
        GROUP BY "teamId"
      `

      initiativesCounts = await prisma.$queryRaw<
        Array<{ teamId: string; initiativesCount: bigint }>
      >`
        SELECT 
          "teamId",
          COUNT(*)::int as "initiativesCount"
        FROM "Initiative"
        WHERE "teamId" IN (${Prisma.join(teamIds)})
        GROUP BY "teamId"
      `
    }

    // Build the response with all relations
    const enrichedTeams = teams.map(team => {
      const peopleCount =
        peopleCounts.find(pc => pc.teamId === team.id)?.peopleCount || 0
      const initiativesCount =
        initiativesCounts.find(ic => ic.teamId === team.id)?.initiativesCount ||
        0

      return {
        ...team,
        parent: team.parentId
          ? { id: team.parentId, name: team.parentName }
          : null,
        _count: {
          people: Number(peopleCount),
          initiatives: Number(initiativesCount),
        },
      }
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      teams: enrichedTeams,
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
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}
