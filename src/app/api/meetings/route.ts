import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'

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

    // Apply date range filter (immutable takes precedence)
    const scheduledFromFilter =
      (immutableFilters.scheduledFrom as string) || scheduledFrom
    const scheduledToFilter =
      (immutableFilters.scheduledTo as string) || scheduledTo

    // Default to upcoming week if no dates specified
    const now = new Date()
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const fromDate = scheduledFromFilter
      ? new Date(scheduledFromFilter)
      : new Date(now.toISOString())
    const toDate = scheduledToFilter
      ? new Date(scheduledToFilter)
      : new Date(oneWeekFromNow.toISOString())

    // Fetch upcoming meeting instances (for recurring meetings)
    const upcomingMeetingInstances = await prisma.meetingInstance.findMany({
      where: {
        organizationId: user.organizationId,
        scheduledAt: {
          gte: fromDate,
          lte: toDate,
        },
        OR: [
          // User is a participant of the instance itself
          {
            participants: {
              some: {
                personId: currentPerson.id,
              },
            },
          },
          // User is a participant of the main meeting
          {
            meeting: {
              participants: {
                some: {
                  personId: currentPerson.id,
                },
              },
            },
          },
          // User is the creator of the meeting
          {
            meeting: {
              createdBy: {
                personId: currentPerson.id,
              },
            },
          },
        ],
      },
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
      orderBy: {
        scheduledAt: 'asc',
      },
    })

    // Fetch upcoming non-recurring meetings
    const upcomingMeetings = await prisma.meeting.findMany({
      where: {
        organizationId: user.organizationId,
        isRecurring: false,
        scheduledAt: {
          gte: fromDate,
          lte: toDate,
        },
        OR: [
          // User is a participant of the meeting
          {
            participants: {
              some: {
                personId: currentPerson.id,
              },
            },
          },
          // User is the creator of the meeting
          {
            createdBy: {
              personId: currentPerson.id,
            },
          },
        ],
      },
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
      orderBy: {
        scheduledAt: 'asc',
      },
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
