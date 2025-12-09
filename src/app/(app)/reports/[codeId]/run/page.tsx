import { notFound } from 'next/navigation'
import { getReport } from '@/lib/reports/registry'
import { DynamicReportForm } from '@/components/dynamic-report-form'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'
import { extractSchemaFields } from '@/lib/utils/schema-extraction'
import { z } from 'zod'

export default async function RunReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ codeId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
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

  const pathname = `/reports/${codeId}/run`
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Reports', href: '/reports' },
    { name: `Run ${def.name}`, href: pathname },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
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
    </PageBreadcrumbSetter>
  )
}
