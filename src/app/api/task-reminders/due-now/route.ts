import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import {
  ensureDeliveryRecordsForUpcoming,
  getDueNowDeliveries,
} from '@/lib/data/task-reminders'

/**
 * GET /api/task-reminders/due-now
 * Returns reminder deliveries that are due now (remindAt <= now, status PENDING) for the current user.
 * Ensures delivery records exist first (lazy creation) so reminders appear even when only this endpoint is polled.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser({ request })
    if (!user.managerOSOrganizationId || !user.managerOSUserId) {
      return NextResponse.json(
        { error: 'User must belong to an organization' },
        { status: 403 }
      )
    }

    const context = {
      userId: user.managerOSUserId,
      organizationId: user.managerOSOrganizationId,
      personId: user.managerOSPersonId ?? undefined,
    }
    await ensureDeliveryRecordsForUpcoming(context)
    const deliveries = await getDueNowDeliveries(context)

    return NextResponse.json({
      reminders: deliveries.map(d => ({
        id: d.id,
        taskId: d.taskId,
        taskTitle: d.task.title,
        taskDueDate: d.taskDueDate,
        remindAt: d.remindAt,
      })),
    })
  } catch (error) {
    console.error('GET /api/task-reminders/due-now:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
