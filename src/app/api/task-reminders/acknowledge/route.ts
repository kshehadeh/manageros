import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { acknowledgeDelivery } from '@/lib/data/task-reminders'

/**
 * POST /api/task-reminders/acknowledge
 * Body: { deliveryId: string }
 * Marks a reminder delivery as acknowledged.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser({ request })
    if (!user.managerOSOrganizationId || !user.managerOSUserId) {
      return NextResponse.json(
        { error: 'User must belong to an organization' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const deliveryId =
      typeof body?.deliveryId === 'string' ? body.deliveryId : null
    if (!deliveryId) {
      return NextResponse.json(
        { error: 'deliveryId is required' },
        { status: 400 }
      )
    }

    await acknowledgeDelivery(deliveryId, {
      userId: user.managerOSUserId,
      organizationId: user.managerOSOrganizationId,
      personId: user.managerOSPersonId ?? undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/task-reminders/acknowledge:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
