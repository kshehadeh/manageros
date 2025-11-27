/**
 * API route for getting external entity details
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { getIntegration } from '@/lib/integrations/integration-factory'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string; externalId: string }> }
) {
  try {
    const { integrationId, externalId } = await params
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

    // Get integration instance
    const integrationInstance = await getIntegration(integrationId)
    if (!integrationInstance) {
      return NextResponse.json(
        { error: 'Failed to create integration instance' },
        { status: 500 }
      )
    }

    // Get entity
    const entity = await integrationInstance.getEntityById(externalId)

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, entity })
  } catch (error) {
    console.error('Get entity error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get entity',
      },
      { status: 500 }
    )
  }
}
