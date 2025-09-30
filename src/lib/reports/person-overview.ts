'use server'

import { z } from 'zod'
import type { ReportDefinition } from './types'
import { renderMarkdownFromJson } from './renderers/markdown'

export const personOverviewInput = z.object({
  personId: z.string(),
  fromDate: z.string(),
  toDate: z.string(),
  includeFeedback: z.boolean().optional().default(false),
})

type Output = {
  person: { id: string, name: string }
  period: { fromDate: string, toDate: string }
  tasks: Array<{ id: string, title: string, status: string, updatedAt?: string | null, completedAt?: string | null }>
  initiatives: Array<{ id: string, title: string, status: string }>
  githubPrs?: Array<{ title: string, repo: string, state: string, mergedAt?: string | null }>
  jiraTickets?: Array<{ key: string, title: string, status: string, project: string }>
  feedbackNotes?: Array<{ kind: string, createdAt: string, isPrivate: boolean }>
}

export const PersonOverviewReport: ReportDefinition<typeof personOverviewInput, Output> = {
  codeId: 'person_overview',
  name: 'Person Overview',
  description: 'Overview of a person’s activity between two dates',
  supportedRenderers: ['markdown'],
  inputSchema: personOverviewInput,
  authorize: async (ctx, input) => {
    if (!ctx.user.organizationId) {
      throw new Error('User must belong to an organization to run reports')
    }
    const person = await ctx.prisma.person.findFirst({
      where: { id: input.personId, organizationId: ctx.user.organizationId },
      select: { id: true },
    })
    if (!person) throw new Error('Person not found or access denied')

    const isOwn = ctx.user.personId === input.personId
    const isAdmin = ctx.user.role === 'ADMIN'
    if (!isOwn && !isAdmin) {
      throw new Error('You can only run this report for yourself or be an org admin')
    }
  },
  execute: async (ctx, input) => {
    const person = await ctx.prisma.person.findFirst({
      where: { id: input.personId, organizationId: ctx.user.organizationId },
      select: { id: true, name: true },
    })
    if (!person) throw new Error('Person not found')

    const tasks = await ctx.prisma.task.findMany({
      where: {
        assigneeId: person.id,
        OR: [
          { updatedAt: { gte: new Date(input.fromDate), lte: new Date(input.toDate) } },
          { completedAt: { gte: new Date(input.fromDate), lte: new Date(input.toDate) } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, status: true, updatedAt: true, completedAt: true },
    })

    const initiatives = await ctx.prisma.initiative.findMany({
      where: {
        organizationId: ctx.user.organizationId,
        owners: { some: { personId: person.id } },
      },
      select: { id: true, title: true, status: true },
    })

    // Optionally enrich with GitHub/Jira based on available linked accounts could be added later

    const output: Output = {
      person: { id: person.id, name: person.name },
      period: { fromDate: input.fromDate, toDate: input.toDate },
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        updatedAt: t.updatedAt?.toISOString() ?? null,
        completedAt: t.completedAt?.toISOString() ?? null,
      })),
      initiatives,
    }

    return output
  },
  renderers: {
    markdown: output => {
      return renderMarkdownFromJson(output)
    },
  },
}

