import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Type definitions for meeting and instance with includes
type MeetingWithRelations = Prisma.MeetingGetPayload<{
  include: {
    team: true
    initiative: true
    owner: true
    createdBy: true
    participants: {
      include: {
        person: true
      }
    }
  }
}> & { type: 'meeting' }

type MeetingInstanceWithRelations = Prisma.MeetingInstanceGetPayload<{
  include: {
    meeting: {
      include: {
        team: true
        initiative: true
        owner: true
        participants: {
          include: {
            person: true
          }
        }
      }
    }
    participants: {
      include: {
        person: true
      }
    }
  }
}> & { type: 'instance' }

type CombinedMeeting = MeetingWithRelations | MeetingInstanceWithRelations

// Build order by clause from sort parameter for regular meetings
function buildOrderByClause(
  sortParam: string
): Prisma.MeetingOrderByWithRelationInput {
  if (!sortParam) return { scheduledAt: 'desc' }

  const [field, direction] = sortParam.split(':')
  const dir = (direction === 'desc' ? 'desc' : 'asc') as Prisma.SortOrder

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
      return { scheduledAt: 'desc' }
  }
}

// Build order by clause from sort parameter for meeting instances
function buildInstanceOrderByClause(
  sortParam: string
): Prisma.MeetingInstanceOrderByWithRelationInput {
  if (!sortParam) return { scheduledAt: 'desc' }

  const [field, direction] = sortParam.split(':')
  const dir = (direction === 'desc' ? 'desc' : 'asc') as Prisma.SortOrder

  switch (field) {
    case 'scheduledAt':
    case 'scheduledDate':
      return { scheduledAt: dir }
    case 'title':
      return { meeting: { title: dir } }
    case 'initiative':
      return { meeting: { initiative: { title: dir } } }
    case 'team':
      return { meeting: { team: { name: dir } } }
    default:
      return { scheduledAt: 'desc' }
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  try {
    // Check if user belongs to an organization
    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'User must belong to an organization to view meetings' },
        { status: 403 }
      )
    }

    // Get the current user's person record (may be null if not linked)
    const currentPerson = await prisma.person.findFirst({
      where: {
        user: { id: user.id },
        organizationId: user.organizationId,
      },
    })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const scheduledFrom = searchParams.get('scheduledFrom') || ''
    const scheduledTo = searchParams.get('scheduledTo') || ''
    const search = searchParams.get('search') || ''
    const teamId = searchParams.get('teamId') || ''
    const initiativeId = searchParams.get('initiativeId') || ''
    const sortParam = searchParams.get('sort') || ''
    const meetingType = searchParams.get('meetingType') || ''

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
    const meetingTypeFilter =
      (immutableFilters.meetingType as string) || meetingType

    // Build where clause for meeting instances
    const buildInstanceWhereClause = (): Prisma.MeetingInstanceWhereInput => {
      const baseWhere: Prisma.MeetingInstanceWhereInput = {
        organizationId: user.organizationId!,
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

      // Build the access control OR clause for instances
      const accessControlOr: Prisma.MeetingInstanceWhereInput[] = []

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

      baseWhere.OR = accessControlOr

      // Add search filter - combine with existing conditions using AND
      if (searchFilter) {
        const existingAnd = Array.isArray(baseWhere.AND)
          ? baseWhere.AND
          : baseWhere.AND
            ? [baseWhere.AND]
            : []
        baseWhere.AND = [
          ...existingAnd,
          {
            meeting: {
              OR: [
                { title: { contains: searchFilter, mode: 'insensitive' } },
                {
                  description: { contains: searchFilter, mode: 'insensitive' },
                },
                { location: { contains: searchFilter, mode: 'insensitive' } },
                { notes: { contains: searchFilter, mode: 'insensitive' } },
              ],
            },
          },
        ]
      }

      // Add team filter
      if (teamIdFilter) {
        if (!baseWhere.meeting) {
          baseWhere.meeting = {}
        }
        baseWhere.meeting.teamId = teamIdFilter
      }

      // Add initiative filter
      if (initiativeIdFilter) {
        if (!baseWhere.meeting) {
          baseWhere.meeting = {}
        }
        baseWhere.meeting.initiativeId = initiativeIdFilter
      }

      return baseWhere
    }

    // Build where clause for regular meetings
    const buildMeetingWhereClause = (): Prisma.MeetingWhereInput => {
      const baseWhere: Prisma.MeetingWhereInput = {
        organizationId: user.organizationId!,
      }

      // Apply meeting type filter
      if (meetingTypeFilter === 'recurring') {
        baseWhere.isRecurring = true
      } else if (meetingTypeFilter === 'non-recurring') {
        baseWhere.isRecurring = false
      } else if (!meetingTypeFilter) {
        // Default behavior: only show non-recurring meetings (when no filter is specified)
        baseWhere.isRecurring = false
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

      // Build the access control OR clause for meetings
      const accessControlOr: Prisma.MeetingWhereInput[] = []

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

      baseWhere.OR = accessControlOr

      // Add search filter - combine with existing conditions using AND
      if (searchFilter) {
        const existingAnd = Array.isArray(baseWhere.AND)
          ? baseWhere.AND
          : baseWhere.AND
            ? [baseWhere.AND]
            : []
        baseWhere.AND = [
          ...existingAnd,
          {
            OR: [
              { title: { contains: searchFilter, mode: 'insensitive' } },
              { description: { contains: searchFilter, mode: 'insensitive' } },
              { location: { contains: searchFilter, mode: 'insensitive' } },
              { notes: { contains: searchFilter, mode: 'insensitive' } },
            ],
          },
        ]
      }

      // Add team filter
      if (teamIdFilter) {
        baseWhere.teamId = teamIdFilter
      }

      // Add initiative filter
      if (initiativeIdFilter) {
        baseWhere.initiativeId = initiativeIdFilter
      }

      return baseWhere
    }

    // Get order by clauses
    const orderBy = buildOrderByClause(sortParam)
    const instanceOrderBy = buildInstanceOrderByClause(sortParam)

    // Fetch data based on meeting type filter
    let upcomingMeetingInstances: MeetingInstanceWithRelations[] = []
    let upcomingMeetings: MeetingWithRelations[] = []

    // Fetch meeting instances if filter is 'instances' or not set
    if (meetingTypeFilter === 'instances' || !meetingTypeFilter) {
      const instances = await prisma.meetingInstance.findMany({
        where: buildInstanceWhereClause(),
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
        orderBy: instanceOrderBy,
      })
      upcomingMeetingInstances = instances.map(instance => ({
        ...instance,
        type: 'instance' as const,
      })) as MeetingInstanceWithRelations[]
    }

    // Fetch meetings if filter is 'recurring', 'non-recurring', or not set
    if (
      meetingTypeFilter === 'recurring' ||
      meetingTypeFilter === 'non-recurring' ||
      !meetingTypeFilter
    ) {
      const meetings = await prisma.meeting.findMany({
        where: buildMeetingWhereClause(),
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
      upcomingMeetings = meetings.map(meeting => ({
        ...meeting,
        type: 'meeting' as const,
      })) as MeetingWithRelations[]
    }

    // Combine and sort all meetings
    const allMeetings: CombinedMeeting[] = [
      ...upcomingMeetings,
      ...upcomingMeetingInstances,
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
        const titleA = a.type === 'instance' ? a.meeting.title : a.title
        const titleB = b.type === 'instance' ? b.meeting.title : b.title
        const comparison = titleA.localeCompare(titleB)
        return orderBy.title === 'desc' ? -comparison : comparison
      })
    } else if (orderBy.initiative) {
      allMeetings.sort((a, b) => {
        const meetingA = a.type === 'instance' ? a.meeting : a
        const meetingB = b.type === 'instance' ? b.meeting : b
        const initiativeA = meetingA.initiative?.title || ''
        const initiativeB = meetingB.initiative?.title || ''
        const comparison = initiativeA.localeCompare(initiativeB)
        return orderBy.initiative?.title === 'desc' ? -comparison : comparison
      })
    } else if (orderBy.team) {
      allMeetings.sort((a, b) => {
        const meetingA = a.type === 'instance' ? a.meeting : a
        const meetingB = b.type === 'instance' ? b.meeting : b
        const teamA = meetingA.team?.name || ''
        const teamB = meetingB.team?.name || ''
        const comparison = teamA.localeCompare(teamB)
        return orderBy.team?.name === 'desc' ? -comparison : comparison
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
