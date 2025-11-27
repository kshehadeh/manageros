/**
 * API route for searching external entities
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { getIntegration } from '@/lib/integrations/integration-factory'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const { integrationId } = await params
    const user = await getCurrentUser()

    if (!user.managerOSOrganizationId && !user.managerOSUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify integration exists and user has access
    const integration = await prisma.integration.findFirst({
      where: {
        id: integrationId,
        OR: [
          {
            organizationId: user.managerOSOrganizationId,
            scope: 'organization',
          },
          {
            userId: user.managerOSUserId,
            scope: 'user',
          },
        ],
      },
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found or access denied' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { query, startDate, endDate, limit } = body

    // Get integration instance
    const integrationInstance = await getIntegration(integrationId)
    if (!integrationInstance) {
      return NextResponse.json(
        { error: 'Failed to create integration instance' },
        { status: 500 }
      )
    }

    // Search entities
    const results = await integrationInstance.searchEntities({
      query,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit || 50,
    })

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Integration search error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Search failed',
        results: [],
      },
      { status: 500 }
    )
  }
}
