import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { snoozeDelivery } from '@/lib/data/task-reminders'

/**
 * POST /api/task-reminders/snooze
 * Body: { deliveryId: string, snoozeMinutes: number }
 * Snoozes a reminder; creates a new delivery with remindAt = now + snoozeMinutes (capped by task due).
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
    const snoozeMinutes =
      typeof body?.snoozeMinutes === 'number' ? body.snoozeMinutes : null
    if (!deliveryId || snoozeMinutes == null) {
      return NextResponse.json(
        { error: 'deliveryId and snoozeMinutes are required' },
        { status: 400 }
      )
    }
    if (snoozeMinutes <= 0) {
      return NextResponse.json(
        { error: 'snoozeMinutes must be positive' },
        { status: 400 }
      )
    }

    await snoozeDelivery(
      deliveryId,
      {
        userId: user.managerOSUserId,
        organizationId: user.managerOSOrganizationId,
        personId: user.managerOSPersonId ?? undefined,
      },
      snoozeMinutes
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/task-reminders/snooze:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
