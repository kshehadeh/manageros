import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma'

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
    return null
  }
  if (statusValues.length === 1) {
    return Prisma.sql`fc."status" = ${statusValues[0]}`
  }
  return Prisma.sql`fc."status" IN (${Prisma.join(statusValues)})`
}

// Helper function to parse sort parameter and build ORDER BY clause
function buildOrderByClause(sortParam: string) {
  if (!sortParam) {
    // Default sorting - most recent first
    return Prisma.sql`ORDER BY fc."createdAt" DESC`
  }

  // Parse comma-separated sort fields
  const sortFields = sortParam
    .split(',')
    .map(s => s.trim())
    .filter(s => s)
    .map(field => {
      const [name, direction = 'asc'] = field.split(':')
      return { name: name.trim(), direction: direction.trim().toLowerCase() }
    })

  if (sortFields.length === 0) {
    return Prisma.sql`ORDER BY fc."createdAt" DESC`
  }

  // Build ORDER BY clause from parsed fields
  const orderByClauses = sortFields
    .map(({ name, direction }) => {
      const dir = direction === 'desc' ? 'DESC' : 'ASC'

      switch (name.toLowerCase()) {
        case 'createdat':
        case 'created_at':
          return Prisma.sql`fc."createdAt" ${Prisma.raw(dir)}`
        case 'enddate':
        case 'end_date':
          return direction === 'desc'
            ? Prisma.sql`fc."endDate" DESC NULLS LAST`
            : Prisma.sql`fc."endDate" ASC NULLS LAST`
        case 'startdate':
        case 'start_date':
          return direction === 'desc'
            ? Prisma.sql`fc."startDate" DESC NULLS LAST`
            : Prisma.sql`fc."startDate" ASC NULLS LAST`
        case 'status':
          return Prisma.sql`fc."status" ${Prisma.raw(dir)}`
        case 'targetperson':
        case 'target_person':
          return direction === 'desc'
            ? Prisma.sql`tp.name DESC NULLS LAST`
            : Prisma.sql`tp.name ASC NULLS LAST`
        default:
          return null
      }
    })
    .filter((clause): clause is Prisma.Sql => clause !== null)

  if (orderByClauses.length === 0) {
    return Prisma.sql`ORDER BY fc."createdAt" DESC`
  }

  return Prisma.sql`ORDER BY ${Prisma.join(orderByClauses, ', ')}`
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  try {
    // Check if user belongs to an organization
    if (!user.managerOSOrganizationId) {
      return NextResponse.json(
        {
          error:
            'User must belong to an organization to view feedback campaigns',
        },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
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
      // Only show campaigns created by current user
      Prisma.sql`fc."userId" = ${user.managerOSUserId || ''}`,
      // Ensure target person is in the same organization
      Prisma.sql`tp."organizationId" = ${user.managerOSOrganizationId}`,
    ]

    // Apply status filter (immutable takes precedence)
    const statusFilter = immutableFilters.status
      ? parseValues(immutableFilters.status as string)
      : statusValues

    if (statusFilter.length > 0 && !statusFilter.includes('all')) {
      const statusCondition = createStatusSqlCondition(statusFilter)
      if (statusCondition !== null) {
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
      FROM "FeedbackCampaign" fc
      INNER JOIN "Person" tp ON fc."targetPersonId" = tp.id
      ${whereClause}
    `
    const totalCount = Number(countResult[0]?.count || 0)

    // Get feedback campaigns with pagination
    const campaigns = await prisma.$queryRaw<
      Array<{
        id: string
        userId: string
        targetPersonId: string
        templateId: string | null
        status: string
        startDate: Date
        endDate: Date
        createdAt: Date
        updatedAt: Date
        targetPersonName: string
        targetPersonEmail: string | null
        templateName: string | null
        templateDescription: string | null
      }>
    >`
      SELECT 
        fc.id,
        fc."userId",
        fc."targetPersonId",
        fc."templateId",
        fc."status",
        fc."startDate",
        fc."endDate",
        fc."createdAt",
        fc."updatedAt",
        tp.name as "targetPersonName",
        tp.email as "targetPersonEmail",
        t.name as "templateName",
        t.description as "templateDescription"
      FROM "FeedbackCampaign" fc
      INNER JOIN "Person" tp ON fc."targetPersonId" = tp.id
      LEFT JOIN "FeedbackTemplate" t ON fc."templateId" = t.id
      ${whereClause}
      ${buildOrderByClause(sort)}
      LIMIT ${limit} OFFSET ${skip}
    `

    // Fetch responses for each campaign
    const campaignIds = campaigns.map(c => c.id)
    let responses: Array<{
      campaignId: string
      responseCount: bigint
      completedCount: bigint
    }> = []

    if (campaignIds.length > 0) {
      responses = await prisma.$queryRaw<
        Array<{
          campaignId: string
          responseCount: bigint
          completedCount: bigint
        }>
      >`
        SELECT 
          "campaignId",
          COUNT(*)::int as "responseCount",
          COUNT(*)::int as "completedCount"
        FROM "FeedbackResponse"
        WHERE "campaignId" IN (${Prisma.join(campaignIds)})
        GROUP BY "campaignId"
      `
    }

    // Build the response with all relations
    const enrichedCampaigns = campaigns.map(campaign => {
      const campaignResponses = responses.find(
        r => r.campaignId === campaign.id
      )
      const responseCount = Number(campaignResponses?.responseCount || 0)
      const completedCount = Number(campaignResponses?.completedCount || 0)

      return {
        id: campaign.id,
        userId: campaign.userId,
        targetPersonId: campaign.targetPersonId,
        templateId: campaign.templateId,
        status: campaign.status,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
        targetPerson: {
          id: campaign.targetPersonId,
          name: campaign.targetPersonName,
          email: campaign.targetPersonEmail || '',
        },
        template: campaign.templateId
          ? {
              id: campaign.templateId,
              name: campaign.templateName || '',
              description: campaign.templateDescription || undefined,
            }
          : null,
        _count: {
          responses: responseCount,
          completedResponses: completedCount,
        },
      }
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      campaigns: enrichedCampaigns,
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
    console.error('Error fetching feedback campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback campaigns' },
      { status: 500 }
    )
  }
}
