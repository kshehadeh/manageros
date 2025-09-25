import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()

  const user = await getCurrentUser()
  if (!user.organizationId) {
    return NextResponse.json({ results: [] })
  }

  if (q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const [tasks, initiatives, people, feedback] = await Promise.all([
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
      },
      select: {
        id: true,
        body: true,
        kind: true,
        about: { select: { id: true, name: true } },
        from: { select: { id: true, name: true } },
      },
      take: 6,
    }),
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
        about: { id: string; name: string }
        from: { id: string; name: string }
      }) => ({
        id: f.id,
        title: f.body.length > 60 ? f.body.substring(0, 60) + '...' : f.body,
        subtitle: `${f.kind} about ${f.about.name} from ${f.from.name}`,
        type: 'feedback' as const,
      })
    ),
  ]

  return NextResponse.json({ results })
}
