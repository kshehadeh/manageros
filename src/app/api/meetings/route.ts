import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'

// Build order by clause from sort parameter
function buildOrderByClause(sortParam: string) {
  if (!sortParam) return { scheduledAt: 'asc' as const }

  const [field, direction] = sortParam.split(':')
  const dir = direction === 'desc' ? 'desc' : 'asc'

  switch (field) {
    case 'scheduledAt':
    case 'scheduledDate':
      return { scheduledAt: dir }
    case 'title':
      return { title: dir }
    case 'initiative':
      return { initiative: { title: dir } }
    case 'team':
      return { team: { name: dir } }
    default:
      return { scheduledAt: 'asc' as const }
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    // Check if user belongs to an organization
    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'User must belong to an organization to view meetings' },
        { status: 403 }
      )
    }

    // Get the current user's person record
    const currentPerson = await prisma.person.findFirst({
      where: {
        user: { id: user.id },
        organizationId: user.organizationId,
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
    const teamId = searchParams.get('teamId') || ''
    const initiativeId = searchParams.get('initiativeId') || ''
    const sortParam = searchParams.get('sort') || ''

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

    // Apply filters (immutable takes precedence)
    const scheduledFromFilter =
      (immutableFilters.scheduledFrom as string) || scheduledFrom
    const scheduledToFilter =
      (immutableFilters.scheduledTo as string) || scheduledTo
    const searchFilter = (immutableFilters.search as string) || search
    const teamIdFilter = (immutableFilters.teamId as string) || teamId
    const initiativeIdFilter =
      (immutableFilters.initiativeId as string) || initiativeId

    // Default to upcoming week if no dates specified
    const now = new Date()
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const fromDate = scheduledFromFilter
      ? new Date(scheduledFromFilter)
      : new Date(now.toISOString())
    const toDate = scheduledToFilter
      ? new Date(scheduledToFilter)
      : new Date(oneWeekFromNow.toISOString())

    // Build where clause for filtering
    const buildWhereClause = (isInstance: boolean) => {
      const baseWhere: any = {
        organizationId: user.organizationId,
        scheduledAt: {
          gte: fromDate,
          lte: toDate,
        },
        OR: [
          // User is a participant
          {
            [isInstance ? 'participants' : 'participants']: {
              some: {
                personId: currentPerson.id,
              },
            },
          },
          // For instances, also check if user is participant of main meeting
          ...(isInstance
            ? [
              {
                meeting: {
                  participants: {
                    some: {
                      personId: currentPerson.id,
                    },
                  },
                },
              },
            ]
            : []),
          // User is the creator
          {
            [isInstance ? 'meeting' : 'createdBy']: isInstance
              ? {
                createdBy: {
                  personId: currentPerson.id,
                },
              }
              : {
                personId: currentPerson.id,
              },
          },
        ],
      }

      // Add search filter
      if (searchFilter) {
        if (isInstance) {
          baseWhere.meeting = {
            ...baseWhere.meeting,
            title: {
              contains: searchFilter,
              mode: 'insensitive',
            },
          }
        } else {
          baseWhere.title = {
            contains: searchFilter,
            mode: 'insensitive',
          }
        }
      }

      // Add team filter
      if (teamIdFilter) {
        if (isInstance) {
          baseWhere.meeting = {
            ...baseWhere.meeting,
            teamId: teamIdFilter,
          }
        } else {
          baseWhere.teamId = teamIdFilter
        }
      }

      // Add initiative filter
      if (initiativeIdFilter) {
        if (isInstance) {
          baseWhere.meeting = {
            ...baseWhere.meeting,
            initiativeId: initiativeIdFilter,
          }
        } else {
          baseWhere.initiativeId = initiativeIdFilter
        }
      }

      if (!isInstance) {
        baseWhere.isRecurring = false
      }

      return baseWhere
    }

    // Get order by clause
    const orderBy = buildOrderByClause(sortParam)

    // Fetch upcoming meeting instances (for recurring meetings)
    const upcomingMeetingInstances = await prisma.meetingInstance.findMany({
      where: buildWhereClause(true),
      include: {
        meeting: {
          include: {
            team: true,
            initiative: true,
            owner: true,
            participants: {
              include: {
                person: true,
              },
            },
          },
        },
        participants: {
          include: {
            person: true,
          },
        },
      },
      orderBy:
        orderBy.scheduledAt !== undefined
          ? { scheduledAt: orderBy.scheduledAt }
          : undefined,
    })

    // Fetch upcoming non-recurring meetings
    const upcomingMeetings = await prisma.meeting.findMany({
      where: buildWhereClause(false),
      include: {
        team: true,
        initiative: true,
        owner: true,
        createdBy: true,
        participants: {
          include: {
            person: true,
          },
        },
      },
      orderBy,
    })

    // Combine and sort all upcoming meetings
    const allUpcomingMeetings = [
      ...upcomingMeetings.map(meeting => ({
        ...meeting,
        type: 'meeting' as const,
      })),
      ...upcomingMeetingInstances.map(instance => ({
        ...instance,
        type: 'instance' as const,
      })),
    ].sort((a, b) => {
      const dateA = a.scheduledAt
      const dateB = b.scheduledAt
      return new Date(dateA).getTime() - new Date(dateB).getTime()
    })

    // Apply pagination
    const skip = (page - 1) * limit
    const paginatedMeetings = allUpcomingMeetings.slice(skip, skip + limit)

    // Calculate pagination metadata
    const totalCount = allUpcomingMeetings.length
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      meetings: paginatedMeetings,
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
    console.error('Error fetching meetings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    )
  }
}
