import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Helper function to parse sort parameter and build ORDER BY clause
function buildOrderByClause(sortParam: string) {
  if (!sortParam) {
    // Default sorting - newest first
    return Prisma.sql`ORDER BY f."createdAt" DESC`
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
    return Prisma.sql`ORDER BY f."createdAt" DESC`
  }

  // Build ORDER BY clause from parsed fields
  const orderByClauses = sortFields
    .map(({ name, direction }) => {
      const dir = direction === 'desc' ? 'DESC' : 'ASC'

      switch (name.toLowerCase()) {
        case 'createdat':
        case 'created_at':
          return Prisma.sql`f."createdAt" ${Prisma.raw(dir)}`
        case 'kind':
          return Prisma.sql`f.kind ${Prisma.raw(dir)}`
        case 'from':
        case 'fromname':
          return direction === 'desc'
            ? Prisma.sql`from_person.name DESC NULLS LAST`
            : Prisma.sql`from_person.name ASC NULLS LAST`
        case 'about':
        case 'aboutname':
          return direction === 'desc'
            ? Prisma.sql`about_person.name DESC NULLS LAST`
            : Prisma.sql`about_person.name ASC NULLS LAST`
        default:
          // If unknown field, skip it
          return null
      }
    })
    .filter((clause): clause is Prisma.Sql => clause !== null)

  if (orderByClauses.length === 0) {
    // If no valid fields, use default
    return Prisma.sql`ORDER BY f."createdAt" DESC`
  }

  return Prisma.sql`ORDER BY ${Prisma.join(orderByClauses, ', ')}`
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    // Check if user belongs to an organization
    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'User must belong to an organization to view feedback' },
        { status: 403 }
      )
    }

    // Get the current user's person record
    const currentPerson = await prisma.person.findFirst({
      where: {
        user: {
          id: user.id,
        },
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
    const search = searchParams.get('search') || ''
    const fromPersonId = searchParams.get('fromPersonId') || ''
    const aboutPersonId = searchParams.get('aboutPersonId') || ''
    const kind = searchParams.get('kind') || ''
    const isPrivate = searchParams.get('isPrivate') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
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
      // Only show feedback that is either:
      // 1. Not private (public feedback)
      // 2. Private feedback written by the current user
      Prisma.sql`(f."isPrivate" = false OR f."fromId" = ${currentPerson.id})`,
      // Ensure feedback is about people in the same organization
      Prisma.sql`about_person."organizationId" = ${user.organizationId}`,
    ]

    // Apply search filter (immutable takes precedence)
    const searchTerm = (immutableFilters.search as string) || search
    if (searchTerm) {
      whereConditions.push(
        Prisma.sql`(
          f.body ILIKE ${`%${searchTerm}%`} OR 
          from_person.name ILIKE ${`%${searchTerm}%`} OR 
          about_person.name ILIKE ${`%${searchTerm}%`}
        )`
      )
    }

    // Apply from person filter (immutable takes precedence)
    const fromFilter = (immutableFilters.fromPersonId as string) || fromPersonId
    if (fromFilter && fromFilter !== 'all') {
      whereConditions.push(Prisma.sql`f."fromId" = ${fromFilter}`)
    }

    // Apply about person filter (immutable takes precedence)
    const aboutFilter =
      (immutableFilters.aboutPersonId as string) || aboutPersonId
    if (aboutFilter && aboutFilter !== 'all') {
      whereConditions.push(Prisma.sql`f."aboutId" = ${aboutFilter}`)
    }

    // Apply kind filter (immutable takes precedence)
    const kindFilter = (immutableFilters.kind as string) || kind
    if (kindFilter && kindFilter !== 'all') {
      whereConditions.push(Prisma.sql`f.kind = ${kindFilter}`)
    }

    // Apply privacy filter (immutable takes precedence)
    const isPrivateFilter = (immutableFilters.isPrivate as string) || isPrivate
    if (isPrivateFilter && isPrivateFilter !== 'all') {
      const isPrivateValue = isPrivateFilter === 'true'
      // If filtering for private, also ensure it's the current user's private feedback
      if (isPrivateValue) {
        whereConditions.push(
          Prisma.sql`(f."isPrivate" = true AND f."fromId" = ${currentPerson.id})`
        )
      } else {
        whereConditions.push(Prisma.sql`f."isPrivate" = false`)
      }
    }

    // Apply date range filter (immutable takes precedence)
    const startDateFilter = (immutableFilters.startDate as string) || startDate
    const endDateFilter = (immutableFilters.endDate as string) || endDate
    if (startDateFilter) {
      whereConditions.push(
        Prisma.sql`f."createdAt" >= ${new Date(startDateFilter)}`
      )
    }
    if (endDateFilter) {
      whereConditions.push(
        Prisma.sql`f."createdAt" <= ${new Date(endDateFilter)}`
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
      FROM "Feedback" f
      LEFT JOIN "Person" from_person ON f."fromId" = from_person.id
      LEFT JOIN "Person" about_person ON f."aboutId" = about_person.id
      ${whereClause}
    `
    const totalCount = Number(countResult[0]?.count || 0)

    // Build ORDER BY clause
    const orderByClause = buildOrderByClause(sort)

    // Get feedback with pagination
    const feedbackRaw = await prisma.$queryRaw<
      Array<{
        id: string
        aboutId: string
        fromId: string
        kind: string
        isPrivate: boolean
        body: string
        createdAt: Date
        aboutName: string
        aboutEmail: string | null
        aboutRole: string | null
        fromName: string
        fromEmail: string | null
        fromRole: string | null
      }>
    >`
      SELECT 
        f.id,
        f."aboutId",
        f."fromId",
        f.kind,
        f."isPrivate",
        f.body,
        f."createdAt",
        about_person.name as "aboutName",
        about_person.email as "aboutEmail",
        about_person.role as "aboutRole",
        from_person.name as "fromName",
        from_person.email as "fromEmail",
        from_person.role as "fromRole"
      FROM "Feedback" f
      LEFT JOIN "Person" from_person ON f."fromId" = from_person.id
      LEFT JOIN "Person" about_person ON f."aboutId" = about_person.id
      ${whereClause}
      ${orderByClause}
      LIMIT ${limit}
      OFFSET ${skip}
    `

    // Map field names to match expected interface
    const feedback = feedbackRaw.map(item => ({
      id: item.id,
      aboutId: item.aboutId,
      fromId: item.fromId,
      kind: item.kind,
      isPrivate: item.isPrivate,
      body: item.body,
      createdAt: item.createdAt.toISOString(),
      about: {
        id: item.aboutId,
        name: item.aboutName,
        email: item.aboutEmail,
        role: item.aboutRole,
      },
      from: {
        id: item.fromId,
        name: item.fromName,
        email: item.fromEmail,
        role: item.fromRole,
      },
    }))

    const response = {
      feedback,
      currentPersonId: currentPerson.id,
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
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}
