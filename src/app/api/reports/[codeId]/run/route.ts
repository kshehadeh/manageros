import { NextRequest, NextResponse } from 'next/server'
import { getReport } from '@/lib/reports/registry'
import { runReport } from '@/lib/actions'
import { requireAuth } from '@/lib/auth-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ codeId: string }> }
) {
  try {
    await requireAuth({ requireOrganization: true })

    const { codeId } = await params
    const formData = await request.formData()
    const input: Record<string, unknown> = {}

    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      input[key] = value
    }

    const def = await getReport(codeId)
    if (!def) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    try {
      const parsed = def.inputSchema.parse(input)
      const result = await runReport({
        codeId: def.codeId,
        renderer: 'markdown',
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
