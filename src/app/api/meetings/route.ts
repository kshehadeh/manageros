import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'

// Build order by clause from sort parameter
function buildOrderByClause(sortParam: string) {
  if (!sortParam) return { scheduledAt: 'desc' as const }

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
      return { scheduledAt: 'desc' as const }
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

    // Build where clause for filtering
    const buildWhereClause = (isInstance: boolean) => {
      const baseWhere: any = {
        organizationId: user.organizationId,
      }

      // Only apply date filters if explicitly provided
      if (scheduledFromFilter || scheduledToFilter) {
        baseWhere.scheduledAt = {}
        if (scheduledFromFilter) {
          baseWhere.scheduledAt.gte = new Date(scheduledFromFilter)
        }
        if (scheduledToFilter) {
          baseWhere.scheduledAt.lte = new Date(scheduledToFilter)
        }
      }

      // Build the access control OR clause
      const accessControlOr: any[] = []

      if (isInstance) {
        // For instances, check:
        // 1. Meeting is public
        accessControlOr.push({
          meeting: {
            isPrivate: false,
          },
        })
        // 2. User is the creator of the meeting
        accessControlOr.push({
          meeting: {
            createdById: user.id,
          },
        })
        // 3. User is the owner of the meeting
        if (currentPerson) {
          accessControlOr.push({
            meeting: {
              ownerId: currentPerson.id,
            },
          })
        }
        // 4. User is a participant of the instance
        if (currentPerson) {
          accessControlOr.push({
            participants: {
              some: {
                personId: currentPerson.id,
              },
            },
          })
        }
        // 5. User is a participant of the main meeting
        if (currentPerson) {
          accessControlOr.push({
            meeting: {
              participants: {
                some: {
                  personId: currentPerson.id,
                },
              },
            },
          })
        }
      } else {
        // For regular meetings, check:
        // 1. Meeting is public
        accessControlOr.push({
          isPrivate: false,
        })
        // 2. User is the creator
        accessControlOr.push({
          createdById: user.id,
        })
        // 3. User is the owner
        if (currentPerson) {
          accessControlOr.push({
            ownerId: currentPerson.id,
          })
        }
        // 4. User is a participant
        if (currentPerson) {
          accessControlOr.push({
            participants: {
              some: {
                personId: currentPerson.id,
              },
            },
          })
        }
      }

      baseWhere.OR = accessControlOr

      // Add search filter
      if (searchFilter) {
        if (isInstance) {
          baseWhere.meeting = {
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
          if (!baseWhere.meeting) baseWhere.meeting = {}
          baseWhere.meeting.teamId = teamIdFilter
        } else {
          baseWhere.teamId = teamIdFilter
        }
      }

      // Add initiative filter
      if (initiativeIdFilter) {
        if (isInstance) {
          if (!baseWhere.meeting) baseWhere.meeting = {}
          baseWhere.meeting.initiativeId = initiativeIdFilter
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

    // Combine and sort all meetings
    const allMeetings = [
      ...upcomingMeetings.map(meeting => ({
        ...meeting,
        type: 'meeting' as const,
      })),
      ...upcomingMeetingInstances.map(instance => ({
        ...instance,
        type: 'instance' as const,
      })),
    ]

    // Sort based on the orderBy parameter
    if (orderBy.scheduledAt) {
      allMeetings.sort((a, b) => {
        const dateA = new Date(a.scheduledAt).getTime()
        const dateB = new Date(b.scheduledAt).getTime()
        return orderBy.scheduledAt === 'desc' ? dateB - dateA : dateA - dateB
      })
    } else if (orderBy.title) {
      allMeetings.sort((a, b) => {
        const titleA =
          (a.type === 'instance'
            ? (a as any).meeting.title
            : (a as any).title) || ''
        const titleB =
          (b.type === 'instance'
            ? (b as any).meeting.title
            : (b as any).title) || ''
        const comparison = titleA.localeCompare(titleB)
        return orderBy.title === 'desc' ? -comparison : comparison
      })
    } else if (orderBy.initiative) {
      allMeetings.sort((a, b) => {
        const meetingA = a.type === 'instance' ? (a as any).meeting : (a as any)
        const meetingB = b.type === 'instance' ? (b as any).meeting : (b as any)
        const initiativeA = meetingA.initiative?.title || ''
        const initiativeB = meetingB.initiative?.title || ''
        const comparison = initiativeA.localeCompare(initiativeB)
        return orderBy.initiative.title === 'desc' ? -comparison : comparison
      })
    } else if (orderBy.team) {
      allMeetings.sort((a, b) => {
        const meetingA = a.type === 'instance' ? (a as any).meeting : (a as any)
        const meetingB = b.type === 'instance' ? (b as any).meeting : (b as any)
        const teamA = meetingA.team?.name || ''
        const teamB = meetingB.team?.name || ''
        const comparison = teamA.localeCompare(teamB)
        return orderBy.team.name === 'desc' ? -comparison : comparison
      })
    }

    // Apply pagination
    const skip = (page - 1) * limit
    const paginatedMeetings = allMeetings.slice(skip, skip + limit)

    // Calculate pagination metadata
    const totalCount = allMeetings.length
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
