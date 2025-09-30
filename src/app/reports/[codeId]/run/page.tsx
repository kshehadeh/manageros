import { notFound, redirect } from 'next/navigation'
import { getReport } from '@/lib/reports/registry'
import { requireAuth } from '@/lib/auth-utils'
import { runReport } from '@/lib/actions'
import { z } from 'zod'

export default async function RunReportPage({ params, searchParams }: {
  params: { codeId: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  await requireAuth({ requireOrganization: true })
  const def = getReport(params.codeId)
  if (!def) return notFound()

  // For initial implementation, accept query params matching schema keys
  const input: Record<string, unknown> = {}
  for (const key of Object.keys(def.inputSchema.shape)) {
    const v = searchParams[key]
    if (typeof v === 'string') input[key] = v
  }

  // Simple server-side run when query has required keys; otherwise show hint
  try {
    const parsed = def.inputSchema.parse(input)
    const result = await runReport({ codeId: def.codeId, renderer: 'markdown', input: parsed })
    redirect(`/reports/instances/${result.instanceId}`)
  } catch (e) {
    // fallthrough to display minimal instructions
  }

  return (
    <div className='p-6 space-y-4'>
      <h1 className='text-2xl font-semibold'>Run {def.name}</h1>
      <p className='text-muted-foreground'>
        Provide parameters via query string. Example:
      </p>
      <pre className='p-3 bg-muted rounded text-sm overflow-x-auto'>
        {`?personId=...&fromDate=2025-01-01&toDate=2025-01-31`}
      </pre>
    </div>
  )
}

