'use server'

import { getCurrentUser } from '@/lib/auth-utils'
import {
  upsertTaskReminderPreference,
  getTaskReminderPreference as getTaskReminderPreferenceData,
} from '@/lib/data/task-reminders'
import { getActionPermission } from '@/lib/auth-utils'

/**
 * Update the current user's reminder preference for a task.
 * Use null to clear the reminder.
 */
export async function updateTaskReminderPreference(
  taskId: string,
  reminderMinutesBeforeDue: number | null
) {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId || !user.managerOSUserId) {
    throw new Error('User must belong to an organization to update reminder')
  }

  const hasPermission = await getActionPermission(user, 'task.edit', taskId)
  if (!hasPermission) {
    throw new Error('Task not found or access denied')
  }

  await upsertTaskReminderPreference(
    taskId,
    {
      userId: user.managerOSUserId,
      organizationId: user.managerOSOrganizationId,
      personId: user.managerOSPersonId ?? undefined,
    },
    reminderMinutesBeforeDue
  )
}

/**
 * Get the current user's reminder preference for a task (for UI that doesn't have full task).
 */
export async function getTaskReminderPreference(
  taskId: string
): Promise<number | null> {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId || !user.managerOSUserId) {
    return null
  }

  const hasPermission = await getActionPermission(user, 'task.view', taskId)
  if (!hasPermission) {
    return null
  }

  return getTaskReminderPreferenceData(taskId, {
    userId: user.managerOSUserId,
    organizationId: user.managerOSOrganizationId,
    personId: user.managerOSPersonId ?? undefined,
  })
}
