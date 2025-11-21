import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Helper function to parse sort parameter and build ORDER BY clause
function buildOrderByClause(sortParam: string) {
  if (!sortParam) {
    // Default sorting - most recent first
    return Prisma.sql`ORDER BY o."scheduledAt" DESC NULLS LAST`
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
    return Prisma.sql`ORDER BY o."scheduledAt" DESC NULLS LAST`
  }

  // Build ORDER BY clause from parsed fields
  const orderByClauses = sortFields
    .map(({ name, direction }) => {
      switch (name.toLowerCase()) {
        case 'scheduledat':
        case 'scheduled_at':
          return direction === 'desc'
            ? Prisma.sql`o."scheduledAt" DESC NULLS LAST`
            : Prisma.sql`o."scheduledAt" ASC NULLS LAST`
        case 'manager':
          return direction === 'desc'
            ? Prisma.sql`manager.name DESC NULLS LAST`
            : Prisma.sql`manager.name ASC NULLS LAST`
        case 'report':
          return direction === 'desc'
            ? Prisma.sql`report.name DESC NULLS LAST`
            : Prisma.sql`report.name ASC NULLS LAST`
        default:
          // If unknown field, skip it
          return null
      }
    })
    .filter((clause): clause is Prisma.Sql => clause !== null)

  if (orderByClauses.length === 0) {
    // If no valid fields, use default
    return Prisma.sql`ORDER BY o."scheduledAt" DESC NULLS LAST`
  }

  return Prisma.sql`ORDER BY ${Prisma.join(orderByClauses, ', ')}`
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  try {
    // Check if user belongs to an organization
    if (!user.managerOSOrganizationId) {
      return NextResponse.json(
        { error: 'User must belong to an organization to view one-on-ones' },
        { status: 403 }
      )
    }

    // Get the current user's person record
    const currentPerson = await prisma.person.findFirst({
      where: {
        user: { id: user.managerOSUserId || '' },
        organizationId: user.managerOSOrganizationId,
      },
    })

    if (!currentPerson) {
      return NextResponse.json(
        { error: 'No person record found for current user' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const scheduledFrom = searchParams.get('scheduledFrom') || ''
    const scheduledTo = searchParams.get('scheduledTo') || ''
    const search = searchParams.get('search') || ''
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
      // Only show one-on-ones where current user is manager or report
      Prisma.sql`(o."managerId" = ${currentPerson.id} OR o."reportId" = ${currentPerson.id})`,
      // Ensure both manager and report belong to the current organization
      Prisma.sql`manager."organizationId" = ${user.managerOSOrganizationId}`,
      Prisma.sql`report."organizationId" = ${user.managerOSOrganizationId}`,
    ]

    // Apply search filter (immutable takes precedence)
    const searchFilter = (immutableFilters.search as string) || search
    if (searchFilter) {
      const searchTerm = `%${searchFilter.toLowerCase()}%`
      whereConditions.push(
        Prisma.sql`(
          LOWER(manager.name) LIKE ${searchTerm} OR
          LOWER(report.name) LIKE ${searchTerm} OR
          LOWER(o.notes) LIKE ${searchTerm}
        )`
      )
    }

    // Apply date range filter (immutable takes precedence)
    const scheduledFromFilter =
      (immutableFilters.scheduledFrom as string) || scheduledFrom
    const scheduledToFilter =
      (immutableFilters.scheduledTo as string) || scheduledTo

    if (scheduledFromFilter) {
      whereConditions.push(
        Prisma.sql`o."scheduledAt" >= ${new Date(scheduledFromFilter)}`
      )
    }
    if (scheduledToFilter) {
      whereConditions.push(
        Prisma.sql`o."scheduledAt" <= ${new Date(scheduledToFilter)}`
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
    // Include JOINs to support search filters that reference manager/report tables
    const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count
      FROM "OneOnOne" o
      INNER JOIN "Person" manager ON o."managerId" = manager.id
      INNER JOIN "Person" report ON o."reportId" = report.id
      ${whereClause}
    `
    const totalCount = Number(countResult[0]?.count || 0)

    // Get one-on-ones with pagination
    const oneOnOnes = await prisma.$queryRaw<
      Array<{
        id: string
        managerId: string
        reportId: string
        scheduledAt: Date | null
        notes: string | null
        managerName: string
        managerEmail: string | null
        managerUserId: string | null
        reportName: string
        reportEmail: string | null
        reportUserId: string | null
      }>
    >`
      SELECT 
        o.id,
        o."managerId",
        o."reportId",
        o."scheduledAt",
        o.notes,
        manager.name as "managerName",
        manager.email as "managerEmail",
        manager_user.id as "managerUserId",
        report.name as "reportName",
        report.email as "reportEmail",
        report_user.id as "reportUserId"
      FROM "OneOnOne" o
      INNER JOIN "Person" manager ON o."managerId" = manager.id
      LEFT JOIN "User" manager_user ON manager_user.id = (
        SELECT id FROM "User" WHERE "personId" = manager.id LIMIT 1
      )
      INNER JOIN "Person" report ON o."reportId" = report.id
      LEFT JOIN "User" report_user ON report_user.id = (
        SELECT id FROM "User" WHERE "personId" = report.id LIMIT 1
      )
      ${whereClause}
      ${buildOrderByClause(sort)}
      LIMIT ${limit} OFFSET ${skip}
    `

    // Format the response to match the expected structure
    const formattedOneOnOnes = oneOnOnes.map(oneOnOne => ({
      id: oneOnOne.id,
      managerId: oneOnOne.managerId,
      reportId: oneOnOne.reportId,
      scheduledAt: oneOnOne.scheduledAt,
      notes: oneOnOne.notes,
      createdAt: oneOnOne.scheduledAt || new Date(),
      updatedAt: oneOnOne.scheduledAt || new Date(),
      manager: {
        id: oneOnOne.managerId,
        name: oneOnOne.managerName,
        email: oneOnOne.managerEmail,
        user: oneOnOne.managerUserId ? { id: oneOnOne.managerUserId } : null,
      },
      report: {
        id: oneOnOne.reportId,
        name: oneOnOne.reportName,
        email: oneOnOne.reportEmail,
        user: oneOnOne.reportUserId ? { id: oneOnOne.reportUserId } : null,
      },
    }))

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      oneonones: formattedOneOnOnes,
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
    console.error('Error fetching one-on-ones:', error)
    return NextResponse.json(
      { error: 'Failed to fetch one-on-ones' },
      { status: 500 }
    )
  }
}
