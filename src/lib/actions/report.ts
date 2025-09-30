'use server'

import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-utils'
import { getReport, listReports } from '@/lib/reports/registry'
import type { ReportRendererId } from '@/lib/reports/types'
import '@/lib/reports/register-all'
import { InputJsonValue } from '@prisma/client/runtime/library'

export async function listAvailableReports() {
  const user = await getCurrentUser()
  if (!user.organizationId)
    throw new Error('User must belong to an organization to list reports')
  // Static registry for now; in future, may combine with DB visibility
  return listReports()
}

export async function runReport(params: {
  codeId: string
  renderer: ReportRendererId
  input: unknown
}) {
  const user = await getCurrentUser()
  if (!user.organizationId)
    throw new Error('User must belong to an organization to run reports')

  const def = await getReport(params.codeId)
  if (!def) throw new Error('Report not found')
  if (!def.supportedRenderers.includes(params.renderer)) {
    throw new Error('Renderer not supported for this report')
  }

  const parsed = def.inputSchema.parse(params.input)

  // Authz enforced by the report itself
  const ctx = {
    prisma,
    user: {
      id: user.id,
      role: user.role,
      organizationId: user.organizationId!,
      personId: user.personId ?? null,
    },
  }
  await def.authorize(ctx, parsed)

  // Execute
  const outputJson = await def.execute(ctx, parsed)

  // Persist instance record
  const instance = await prisma.reportInstance.create({
    data: {
      report: {
        connectOrCreate: {
          where: { codeId: def.codeId },
          create: {
            codeId: def.codeId,
            name: def.name,
            description: def.description ?? null,
            ownerId: user.id,
            inputSchema: def.inputSchema ? {} : {},
            enabled: true,
            renderers: def.supportedRenderers,
          },
        },
      },
      user: { connect: { id: user.id } },
      organization: { connect: { id: user.organizationId } },
      renderer: params.renderer,
      input: parsed as unknown as Record<string, InputJsonValue>,
      output: outputJson as unknown as Record<string, InputJsonValue>,
      status: 'completed',
      completedAt: new Date(),
    },
    include: { report: true },
  })

  // Render human-readable content
  const renderFn = def.renderers[params.renderer]
  const rendered = renderFn ? await renderFn(outputJson) : ''

  return {
    instanceId: instance.id,
    reportCodeId: def.codeId,
    reportName: def.name,
    renderer: params.renderer,
    outputMarkdown: rendered,
    output: outputJson,
    input: parsed,
    createdAt: instance.startedAt?.toISOString?.() ?? new Date().toISOString(),
  }
}

export async function listReportInstances(limit = 20) {
  const user = await getCurrentUser()
  if (!user.organizationId)
    throw new Error(
      'User must belong to an organization to list report instances'
    )

  const instances = await prisma.reportInstance.findMany({
    where: { organizationId: user.organizationId, userId: user.id },
    orderBy: { startedAt: 'desc' },
    take: limit,
    include: { report: true },
  })

  return instances.map(i => ({
    id: i.id,
    reportCodeId: i.report.codeId,
    reportName: i.report.name,
    renderer: i.renderer,
    status: i.status,
    createdAt: i.startedAt.toISOString(),
    completedAt: i.completedAt?.toISOString() ?? null,
  }))
}

export async function getReportInstance(id: string) {
  const user = await getCurrentUser()
  if (!user.organizationId)
    throw new Error(
      'User must belong to an organization to view report instances'
    )

  const instance = await prisma.reportInstance.findFirst({
    where: { id, organizationId: user.organizationId, userId: user.id },
    include: { report: true },
  })
  if (!instance) throw new Error('Report instance not found or access denied')

  const def = await getReport(instance.report.codeId)
  const mark = def?.renderers?.[instance.renderer as ReportRendererId]
    ? await def!.renderers[instance.renderer as ReportRendererId]!(
        instance.output as unknown
      )
    : ''

  return {
    id: instance.id,
    reportCodeId: instance.report.codeId,
    reportName: instance.report.name,
    renderer: instance.renderer,
    status: instance.status,
    input: instance.input as unknown,
    output: instance.output as unknown,
    outputMarkdown: mark,
    createdAt: instance.startedAt.toISOString(),
    completedAt: instance.completedAt?.toISOString() ?? null,
  }
}

export async function deleteReportInstance(id: string) {
  const user = await getCurrentUser()
  if (!user.organizationId)
    throw new Error(
      'User must belong to an organization to delete report instances'
    )

  // Verify the instance exists and belongs to the user
  const instance = await prisma.reportInstance.findFirst({
    where: { id, organizationId: user.organizationId, userId: user.id },
  })
  if (!instance) throw new Error('Report instance not found or access denied')

  // Delete the instance
  await prisma.reportInstance.delete({
    where: { id },
  })

  return { success: true }
}
