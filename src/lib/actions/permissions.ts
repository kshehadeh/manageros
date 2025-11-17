'use server'

import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'

/**
 * All available permissions in the system
 * This list should match the PermissionMap in auth-utils.ts
 */
const ALL_PERMISSIONS = [
  // Task permissions
  'task.create',
  'task.edit',
  'task.delete',
  'task.view',
  // Meeting permissions
  'meeting.create',
  'meeting.edit',
  'meeting.delete',
  'meeting.view',
  // Meeting Instance permissions
  'meeting-instance.create',
  'meeting-instance.edit',
  'meeting-instance.delete',
  'meeting-instance.view',
  // Initiative permissions
  'initiative.create',
  'initiative.edit',
  'initiative.delete',
  'initiative.view',
  // Report permissions
  'report.access',
  'report.create',
  'report.edit',
  'report.delete',
  'report.view',
  // Feedback permissions
  'feedback.create',
  'feedback.edit',
  'feedback.delete',
  'feedback.view',
  // One-on-One permissions
  'oneonone.create',
  'oneonone.edit',
  'oneonone.delete',
  'oneonone.view',
  // Feedback Campaign permissions
  'feedback-campaign.create',
  'feedback-campaign.edit',
  'feedback-campaign.delete',
  'feedback-campaign.view',
  // User linking permissions
  'user.link-person',
  // Person permissions
  'person.create',
  'person.edit',
  'person.delete',
  'person.view',
  'person.overview.view',
] as const

/**
 * Permissions that require an ID parameter to check access
 * These permissions check ownership/participation of specific entities
 */
const PERMISSIONS_REQUIRING_ID = [
  'task.edit',
  'task.delete',
  'meeting.edit',
  'meeting.delete',
  'meeting-instance.edit',
  'meeting-instance.delete',
  'meeting-instance.view',
  'feedback.edit',
  'feedback.delete',
  'oneonone.edit',
  'oneonone.delete',
  'oneonone.view',
  'feedback-campaign.edit',
  'feedback-campaign.delete',
  'feedback-campaign.view',
] as const

export interface PermissionStatus {
  action: string
  hasAccess: boolean
  requiresId: boolean
}

/**
 * Get all permissions and their access status for the current user
 */
export async function getUserPermissions(): Promise<PermissionStatus[]> {
  const user = await getCurrentUser()

  const permissions: PermissionStatus[] = await Promise.all(
    ALL_PERMISSIONS.map(async action => {
      const requiresId = PERMISSIONS_REQUIRING_ID.includes(
        action as (typeof PERMISSIONS_REQUIRING_ID)[number]
      )

      // For permissions that require an ID, we check without an ID
      // to see if the user has the general capability
      // The result will be false, but we'll show a tilde to indicate conditional access
      const hasAccess = await getActionPermission(user, action)

      return {
        action,
        hasAccess,
        requiresId,
      }
    })
  )

  return permissions
}
