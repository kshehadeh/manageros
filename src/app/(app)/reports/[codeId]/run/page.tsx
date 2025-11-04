import { notFound } from 'next/navigation'
import { getReport } from '@/lib/reports/registry'
import { requireAuth } from '@/lib/auth-utils'
import { DynamicReportForm } from '@/components/dynamic-report-form'
import { ReportRunBreadcrumbClient } from '@/components/report-run-breadcrumb-client'
import { extractSchemaFields } from '@/lib/utils/schema-extraction'
import { z } from 'zod'

export default async function RunReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ codeId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAuth({ requireOrganization: true })
  const { codeId } = await params
  const searchParamsFinal = await searchParams
  const def = await getReport(codeId)
  if (!def) return notFound()

  // For initial implementation, accept query params matching schema keys
  const input: Record<string, unknown> = {}
  if (def.inputSchema instanceof z.ZodObject) {
    for (const key of Object.keys(def.inputSchema.shape)) {
      const v = searchParamsFinal[key]
      if (typeof v === 'string') input[key] = v
    }
  }

  // Always show the form for user interaction

  // Extract serializable schema information
  const schemaFields = extractSchemaFields(def.inputSchema)

  return (
    <ReportRunBreadcrumbClient reportName={def.name} codeId={codeId}>
      <div className='p-6'>
        <DynamicReportForm
          reportName={def.name}
          reportDescription={def.description}
          schemaFields={schemaFields}
          codeId={codeId}
          initialData={input}
          supportedRenderers={def.supportedRenderers}
        />
      </div>
    </ReportRunBreadcrumbClient>
  )
}
