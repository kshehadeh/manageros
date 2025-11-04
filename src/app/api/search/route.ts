import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-utils'

export async function GET(request: Request) {
  const user = await getCurrentUser()

  const { searchParams } = new URL(request.url)

  try {
    const q = (searchParams.get('q') || '').trim()

    if (!user.organizationId) {
      return NextResponse.json({ results: [] })
    }

    if (q.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const [tasks, initiatives, people, feedback, oneOnOnes, meetings] =
      await Promise.all([
        prisma.task.findMany({
          where: {
            title: { contains: q, mode: 'insensitive' },
            createdBy: { organizationId: user.organizationId },
          },
          select: { id: true, title: true, description: true },
          take: 8,
        }),
        prisma.initiative.findMany({
          where: {
            title: { contains: q, mode: 'insensitive' },
            organizationId: user.organizationId,
          },
          select: { id: true, title: true, summary: true },
          take: 6,
        }),
        prisma.person.findMany({
          where: {
            name: { contains: q, mode: 'insensitive' },
            organizationId: user.organizationId,
          },
          select: { id: true, name: true },
          take: 6,
        }),
        prisma.feedback.findMany({
          where: {
            body: { contains: q, mode: 'insensitive' },
            about: { organizationId: user.organizationId },
            // Only return feedback if:
            // 1. It's not private, OR
            // 2. The current user is either the person giving feedback (from) or receiving feedback (about)
            OR: [
              { isPrivate: false },
              ...(user.personId
                ? [{ fromId: user.personId }, { aboutId: user.personId }]
                : []),
            ],
          },
          select: {
            id: true,
            body: true,
            kind: true,
            isPrivate: true,
            about: { select: { id: true, name: true } },
            from: { select: { id: true, name: true } },
          },
          take: 6,
        }),
        // Only query 1:1s if the user has a personId (is linked to a Person record)
        user.personId
          ? prisma.oneOnOne.findMany({
              where: {
                OR: [
                  { notes: { contains: q, mode: 'insensitive' } },
                  { manager: { name: { contains: q, mode: 'insensitive' } } },
                  { report: { name: { contains: q, mode: 'insensitive' } } },
                ],
                AND: [
                  {
                    OR: [
                      // User is the manager
                      { managerId: user.personId },
                      // User is the report
                      { reportId: user.personId },
                    ],
                  },
                ],
              },
              select: {
                id: true,
                notes: true,
                scheduledAt: true,
                manager: { select: { id: true, name: true } },
                report: { select: { id: true, name: true } },
              },
              take: 6,
            })
          : Promise.resolve([]), // Return empty array if user has no personId
        // Get the current user's person record for meeting access control
        user.personId
          ? prisma.meeting.findMany({
              where: {
                OR: [
                  { title: { contains: q, mode: 'insensitive' } },
                  { description: { contains: q, mode: 'insensitive' } },
                  { notes: { contains: q, mode: 'insensitive' } },
                ],
                AND: [
                  { organizationId: user.organizationId },
                  {
                    OR: [
                      { isPrivate: false }, // Public meetings
                      { createdById: user.id }, // Private meetings created by current user
                      {
                        participants: {
                          some: {
                            personId: user.personId,
                          },
                        },
                      }, // Meetings where user is a participant
                    ],
                  },
                ],
              },
              select: {
                id: true,
                title: true,
                description: true,
                scheduledAt: true,
                location: true,
                owner: { select: { id: true, name: true } },
              },
              take: 6,
            })
          : Promise.resolve([]), // Return empty array if user has no personId
      ])

    const results = [
      ...tasks.map(
        (t: { id: string; title: string; description: string | null }) => ({
          id: t.id,
          title: t.title,
          subtitle: t.description || undefined,
          type: 'task' as const,
        })
      ),
      ...initiatives.map(
        (i: { id: string; title: string; summary: string | null }) => ({
          id: i.id,
          title: i.title,
          subtitle: i.summary || undefined,
          type: 'initiative' as const,
        })
      ),
      ...people.map((p: { id: string; name: string }) => ({
        id: p.id,
        title: p.name,
        type: 'person' as const,
      })),
      ...feedback.map(
        (f: {
          id: string
          body: string
          kind: string
          isPrivate: boolean
          about: { id: string; name: string }
          from: { id: string; name: string }
        }) => ({
          id: f.id,
          title: f.body.length > 60 ? f.body.substring(0, 60) + '...' : f.body,
          subtitle: `${f.kind} about ${f.about.name} from ${f.from.name}`,
          type: 'feedback' as const,
        })
      ),
      ...oneOnOnes.map(
        (o: {
          id: string
          notes: string | null
          scheduledAt: Date | null
          manager: { id: string; name: string }
          report: { id: string; name: string }
        }) => ({
          id: o.id,
          title: `1:1 - ${o.manager.name} & ${o.report.name}`,
          subtitle: o.scheduledAt
            ? `Scheduled for ${new Date(o.scheduledAt).toLocaleDateString()}`
            : 'Not scheduled',
          type: 'oneOnOne' as const,
        })
      ),
      ...meetings.map(
        (m: {
          id: string
          title: string
          description: string | null
          scheduledAt: Date
          location: string | null
          owner: { id: string; name: string } | null
        }) => ({
          id: m.id,
          title: m.title,
          subtitle: m.scheduledAt
            ? `Scheduled for ${new Date(m.scheduledAt).toLocaleDateString()}${m.location ? ` at ${m.location}` : ''}${m.owner ? ` - Owner: ${m.owner.name}` : ''}`
            : 'No date set',
          type: 'meeting' as const,
        })
      ),
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search API error:', error)

    // Return empty results on error to prevent breaking the UI
    return NextResponse.json({ results: [] }, { status: 200 })
  }
}
