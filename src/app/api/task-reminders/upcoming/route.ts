import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { getUpcomingDeliveries } from '@/lib/data/task-reminders'

/**
 * GET /api/task-reminders/upcoming
 * Returns reminder deliveries for the current user with remindAt in the next 24h.
 * Lazily creates delivery records for tasks with due date and reminder preference.
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

    const windowMs = 24 * 60 * 60 * 1000
    const deliveries = await getUpcomingDeliveries(
      {
        userId: user.managerOSUserId,
        organizationId: user.managerOSOrganizationId,
        personId: user.managerOSPersonId ?? undefined,
      },
      windowMs
    )

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
    console.error('GET /api/task-reminders/upcoming:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
