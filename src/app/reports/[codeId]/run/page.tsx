import { notFound } from 'next/navigation'
import { getReport } from '@/lib/reports/registry'
import { requireAuth } from '@/lib/auth-utils'
import { DynamicReportForm } from '@/components/dynamic-report-form'
import { ReportRunBreadcrumbClient } from '@/components/report-run-breadcrumb-client'

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
  if (def.inputSchema._def && def.inputSchema._def.shape) {
    for (const key of Object.keys(def.inputSchema._def.shape)) {
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
        />
      </div>
    </ReportRunBreadcrumbClient>
  )
}

// Helper function to extract serializable field information from Zod schema
function extractSchemaFields(schema: unknown) {
  const fields: Array<{
    name: string
    type: string
    required: boolean
    defaultValue?: unknown
  }> = []

  if (schema && typeof schema === 'object' && '_def' in schema) {
    const schemaWithDef = schema as {
      _def: { shape?: () => Record<string, unknown> }
    }
    if (schemaWithDef._def && schemaWithDef._def.shape) {
      const shape = schemaWithDef._def.shape()
      for (const [key, fieldSchema] of Object.entries(shape)) {
        const field = fieldSchema as {
          _def?: {
            typeName?: string
            innerType?: {
              _def?: {
                typeName?: string
                innerType?: { _def?: { typeName?: string } }
              }
            }
            defaultValue?: () => unknown
          }
        }
        const fieldInfo: {
          name: string
          type: string
          required: boolean
          defaultValue?: unknown
        } = {
          name: key,
          type: 'string', // default
          required: true,
        }

        // Determine field type and properties
        if (field._def) {
          const def = field._def

          // Check for optional fields
          if (def.typeName === 'ZodOptional') {
            fieldInfo.required = false
            // Get the inner type
            if (def.innerType && def.innerType._def) {
              fieldInfo.type = getZodTypeName(
                def.innerType._def.typeName || 'ZodString'
              )
            }
          } else if (def.typeName === 'ZodDefault') {
            fieldInfo.required = false
            fieldInfo.defaultValue = def.defaultValue?.()
            // Get the inner type - handle nested structure
            if (def.innerType && def.innerType._def) {
              if (def.innerType._def.typeName === 'ZodOptional') {
                // ZodDefault -> ZodOptional -> actual type
                if (
                  def.innerType._def.innerType &&
                  def.innerType._def.innerType._def
                ) {
                  fieldInfo.type = getZodTypeName(
                    def.innerType._def.innerType._def.typeName || 'ZodString'
                  )
                }
              } else {
                fieldInfo.type = getZodTypeName(
                  def.innerType._def.typeName || 'ZodString'
                )
              }
            }
          } else {
            fieldInfo.type = getZodTypeName(def.typeName || 'ZodString')
          }
        }

        fields.push(fieldInfo)
      }
    }
  }

  return fields
}

function getZodTypeName(typeName: string): string {
  switch (typeName) {
    case 'ZodString':
      return 'string'
    case 'ZodBoolean':
      return 'boolean'
    case 'ZodNumber':
      return 'number'
    case 'ZodDate':
      return 'date'
    default:
      return 'string'
  }
}
