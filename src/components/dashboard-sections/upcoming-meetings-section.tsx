import { prisma } from '@/lib/db'
import { DashboardUpcomingMeetings } from '@/components/meetings/dashboard-upcoming-meetings'
import { ExpandableSection } from '@/components/expandable-section'
import { type UpcomingMeeting } from '@/components/meetings/shared-meetings-table'

interface DashboardUpcomingMeetingsSectionProps {
  userId: string
  organizationId: string
}

export async function DashboardUpcomingMeetingsSection({
  userId,
  organizationId,
}: DashboardUpcomingMeetingsSectionProps) {
  // Use UTC dates for proper timezone handling
  const now = new Date()
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Convert to UTC for database comparison
  const nowUTC = new Date(now.toISOString())
  const oneWeekFromNowUTC = new Date(oneWeekFromNow.toISOString())

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: { id: userId },
      organizationId,
    },
  })

  if (!currentPerson) {
    return null
  }

  // Fetch upcoming meeting instances (for recurring meetings)
  // Show instances where user is a participant of the main meeting OR the instance OR the creator
  const upcomingMeetingInstances = await prisma.meetingInstance.findMany({
    where: {
      organizationId,
      scheduledAt: {
        gte: nowUTC,
        lte: oneWeekFromNowUTC,
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
      organizationId,
      isRecurring: false,
      scheduledAt: {
        gte: nowUTC,
        lte: oneWeekFromNowUTC,
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
  // For recurring meetings, we only show instances, not the main meeting
  const allUpcomingMeetings: UpcomingMeeting[] = [
    ...upcomingMeetings.map(meeting => ({
      ...meeting,
      type: 'meeting' as const,
    })),
    ...upcomingMeetingInstances.map(instance => ({
      ...instance,
      type: 'instance' as const,
    })),
  ]
    .sort((a, b) => {
      const dateA = a.type === 'meeting' ? a.scheduledAt : a.scheduledAt
      const dateB = b.type === 'meeting' ? b.scheduledAt : b.scheduledAt
      return new Date(dateA).getTime() - new Date(dateB).getTime()
    })
    .slice(0, 5) // Limit to 5 total items

  if (!allUpcomingMeetings || allUpcomingMeetings.length === 0) return null

  return (
    <ExpandableSection title='Upcoming Meetings' viewAllHref='/meetings'>
      <DashboardUpcomingMeetings meetings={allUpcomingMeetings} />
    </ExpandableSection>
  )
}
