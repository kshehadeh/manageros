import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-utils'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  try {
    // Check if user belongs to an organization
    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'User must belong to an organization to view job roles' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const levelId = searchParams.get('levelId') || ''
    const domainId = searchParams.get('domainId') || ''
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

    // Build where conditions
    const whereConditions: Prisma.Sql[] = [
      Prisma.sql`jr."organizationId" = ${user.organizationId}`,
    ]

    // Apply search filter (immutable takes precedence)
    const searchTerm = (immutableFilters.search as string) || search
    if (searchTerm) {
      whereConditions.push(Prisma.sql`jr.title ILIKE ${`%${searchTerm}%`}`)
    }

    // Apply level filter
    const levelFilter = (immutableFilters.levelId as string) || levelId
    if (levelFilter && levelFilter !== 'all' && levelFilter !== '') {
      whereConditions.push(Prisma.sql`jr."levelId" = ${levelFilter}`)
    }

    // Apply domain filter
    const domainFilter = (immutableFilters.domainId as string) || domainId
    if (domainFilter && domainFilter !== 'all' && domainFilter !== '') {
      whereConditions.push(Prisma.sql`jr."domainId" = ${domainFilter}`)
    }

    const whereClause =
      whereConditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}`
        : Prisma.empty

    // Get total count
    const skip = (page - 1) * limit
    const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "JobRole" jr
      ${whereClause}
    `
    const totalCount = Number(countResult[0]?.count || 0)

    // Build ORDER BY clause
    let orderByClause = Prisma.sql`ORDER BY jl."order" ASC, jd.name ASC, jr.title ASC`

    if (sort) {
      const [field, direction] = sort.split(':')
      if (field === 'title') {
        orderByClause = Prisma.sql`ORDER BY jr.title ${Prisma.raw(direction === 'desc' ? 'DESC' : 'ASC')}`
      } else if (field === 'level') {
        orderByClause = Prisma.sql`ORDER BY jl."order" ${Prisma.raw(direction === 'desc' ? 'DESC' : 'ASC')}, jr.title ASC`
      } else if (field === 'domain') {
        orderByClause = Prisma.sql`ORDER BY jd.name ${Prisma.raw(direction === 'desc' ? 'DESC' : 'ASC')}, jr.title ASC`
      }
    }

    // Get job roles with pagination
    const jobRolesRaw = await prisma.$queryRaw<
      Array<{
        id: string
        title: string
        description: string | null
        organizationId: string
        createdAt: Date
        updatedAt: Date
        levelId: string
        domainId: string
        levelName: string
        levelOrder: number
        domainName: string
      }>
    >`
      SELECT 
        jr.id,
        jr.title,
        jr.description,
        jr."organizationId",
        jr."createdAt",
        jr."updatedAt",
        jr."levelId",
        jr."domainId",
        jl.name as "levelName",
        jl."order" as "levelOrder",
        jd.name as "domainName"
      FROM "JobRole" jr
      LEFT JOIN "JobLevel" jl ON jr."levelId" = jl.id
      LEFT JOIN "JobDomain" jd ON jr."domainId" = jd.id
      ${whereClause}
      ${orderByClause}
      LIMIT ${limit}
      OFFSET ${skip}
    `

    // Get people count for each job role
    const jobRoleIds = jobRolesRaw.map(jr => jr.id)

    // Get actual people for each job role
    const peopleData = await prisma.person.findMany({
      where: {
        jobRoleId: { in: jobRoleIds },
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        name: true,
        jobRoleId: true,
      },
    })

    const peopleByJobRole = new Map<
      string,
      Array<{ id: string; name: string }>
    >()
    peopleData.forEach(person => {
      if (person.jobRoleId) {
        if (!peopleByJobRole.has(person.jobRoleId)) {
          peopleByJobRole.set(person.jobRoleId, [])
        }
        peopleByJobRole.get(person.jobRoleId)!.push({
          id: person.id,
          name: person.name,
        })
      }
    })

    // Map field names to match expected interface
    const jobRoles = jobRolesRaw.map(jr => ({
      id: jr.id,
      title: jr.title,
      description: jr.description,
      organizationId: jr.organizationId,
      createdAt: jr.createdAt.toISOString(),
      updatedAt: jr.updatedAt.toISOString(),
      level: {
        id: jr.levelId,
        name: jr.levelName,
      },
      domain: {
        id: jr.domainId,
        name: jr.domainName,
      },
      people: peopleByJobRole.get(jr.id) || [],
    }))

    const response = {
      jobroles: jobRoles,
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
    console.error('Error fetching job roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job roles' },
      { status: 500 }
    )
  }
}
