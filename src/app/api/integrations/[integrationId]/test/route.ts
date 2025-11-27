/**
 * API route for testing integration connections
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, requireAdmin } from '@/lib/auth-utils'
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

    // Check permissions based on scope
    if (integration.scope === 'organization') {
      await requireAdmin()
    } else if (integration.userId !== user.managerOSUserId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Test connection
    const integrationInstance = await getIntegration(integrationId)
    if (!integrationInstance) {
      return NextResponse.json(
        { error: 'Failed to create integration instance' },
        { status: 500 }
      )
    }

    const isValid = await integrationInstance.testConnection()

    return NextResponse.json({ success: isValid })
  } catch (error) {
    console.error('Integration test error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Connection test failed',
      },
      { status: 500 }
    )
  }
}
