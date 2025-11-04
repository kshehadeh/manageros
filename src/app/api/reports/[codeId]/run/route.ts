import { NextRequest, NextResponse } from 'next/server'
import { getReport } from '@/lib/reports/registry'
import { runReport } from '@/lib/actions/report'
import { requireAuth } from '@/lib/auth-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ codeId: string }> }
) {
  await requireAuth({ requireOrganization: true })
  try {
    const { codeId } = await params
    const formData = await request.formData()
    const input: Record<string, unknown> = {}

    // Extract renderer (shared across all reports)
    const renderer = formData.get('renderer')?.toString() || 'markdown'

    // Convert FormData to object with proper type conversion (excluding renderer)
    for (const [key, value] of formData.entries()) {
      if (key === 'renderer') continue // Skip renderer field
      const stringValue = value.toString()

      // Convert string representations of booleans to actual booleans
      if (stringValue === 'true') {
        input[key] = true
      } else if (stringValue === 'false') {
        input[key] = false
      } else {
        input[key] = stringValue
      }
    }

    const def = await getReport(codeId)
    if (!def) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Validate renderer is supported
    if (!def.supportedRenderers.includes(renderer as 'markdown' | 'web')) {
      return NextResponse.json(
        { error: `Renderer '${renderer}' is not supported for this report` },
        { status: 400 }
      )
    }

    try {
      const parsed = def.inputSchema.parse(input)
      const result = await runReport({
        codeId: def.codeId,
        renderer: renderer as 'markdown' | 'web',
        input: parsed,
      })

      // Return the result as JSON instead of redirecting
      return NextResponse.json({
        success: true,
        instanceId: result.instanceId,
        redirectUrl: `/reports/instances/${result.instanceId}`,
      })
    } catch (error) {
      console.error('Report execution error:', error)
      return NextResponse.json(
        { error: 'Invalid form data. Please check your inputs and try again.' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Route handler error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing the request' },
      { status: 500 }
    )
  }
}
