'use server'

import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-utils'
import { getReport, listReports } from '@/lib/reports/registry'
import type { ReportRendererId } from '@/lib/reports/types'
import '@/lib/reports/register-all'
import { InputJsonValue } from '@prisma/client/runtime/library'

export async function listAvailableReports() {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId)
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
  if (!user.managerOSOrganizationId)
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
      id: user.managerOSUserId || '',
      role: user.role || 'USER',
      organizationId: user.managerOSOrganizationId!,
      personId: user.managerOSPersonId ?? null,
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
            ownerId: user.managerOSUserId || '',
            inputSchema: def.inputSchema ? {} : {},
            enabled: true,
            renderers: def.supportedRenderers,
          },
        },
      },
      user: { connect: { id: user.managerOSUserId || '' } },
      organization: { connect: { id: user.managerOSOrganizationId } },
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
  if (!user.managerOSOrganizationId)
    throw new Error(
      'User must belong to an organization to list report instances'
    )

  const instances = await prisma.reportInstance.findMany({
    where: {
      organizationId: user.managerOSOrganizationId,
      userId: user.managerOSUserId || '',
    },
    orderBy: { startedAt: 'desc' },
    take: limit,
    include: { report: true },
  })

  // Resolve identifiers for each instance
  const instancesWithIdentifiers = await Promise.all(
    instances.map(async i => {
      const def = await getReport(i.report.codeId)
      let identifierText = ''

      if (def?.identifierFields && i.input) {
        const inputData = i.input as Record<string, unknown>
        const resolvedIdentifiers = await Promise.all(
          def.identifierFields.map(async field => {
            const value = inputData[field.fieldName]
            if (value && typeof value === 'string') {
              const ctx = {
                prisma,
                user: {
                  id: user.managerOSUserId || '',
                  role: user.role || 'USER',
                  organizationId: user.managerOSOrganizationId!,
                  personId: user.managerOSPersonId ?? null,
                },
              }
              const resolvedName = await field.resolveToName(value, ctx)
              return `${field.displayName}: ${resolvedName}`
            }
            return null
          })
        )
        identifierText = resolvedIdentifiers.filter(Boolean).join(', ')
      }

      return {
        id: i.id,
        reportCodeId: i.report.codeId,
        reportName: i.report.name,
        renderer: i.renderer,
        status: i.status,
        createdAt: i.startedAt.toISOString(),
        completedAt: i.completedAt?.toISOString() ?? null,
        identifierText,
      }
    })
  )

  return instancesWithIdentifiers
}

export async function getReportInstance(id: string) {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId)
    throw new Error(
      'User must belong to an organization to view report instances'
    )

  const instance = await prisma.reportInstance.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
      userId: user.managerOSUserId || '',
    },
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
  if (!user.managerOSOrganizationId)
    throw new Error(
      'User must belong to an organization to delete report instances'
    )

  // Verify the instance exists and belongs to the user
  const instance = await prisma.reportInstance.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
      userId: user.managerOSUserId || '',
    },
  })
  if (!instance) throw new Error('Report instance not found or access denied')

  // Delete the instance
  await prisma.reportInstance.delete({
    where: { id },
  })

  return { success: true }
}
