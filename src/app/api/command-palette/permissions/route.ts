import { NextResponse } from 'next/server'
import {
  getCurrentUser,
  getActionPermission,
  isAdminOrOwner,
} from '@/lib/auth-utils'

/**
 * API endpoint to get permissions for command palette actions
 * Returns permissions for all "create" actions that appear in the command palette
 */
export async function GET() {
  try {
    const user = await getCurrentUser()

    // Check permissions for all create actions used in command palette
    const permissions = await Promise.all([
      getActionPermission(user, 'task.create'),
      getActionPermission(user, 'initiative.create'),
      getActionPermission(user, 'feedback.create'),
      getActionPermission(user, 'oneonone.create'),
      getActionPermission(user, 'feedback-campaign.create'),
      getActionPermission(user, 'report.create'),
    ])

    return NextResponse.json({
      permissions: {
        'task.create': permissions[0],
        'initiative.create': permissions[2],
        'feedback.create': permissions[3],
        'oneonone.create': permissions[4],
        'feedback-campaign.create': permissions[5],
        'report.create': permissions[5],
        isAdmin: isAdminOrOwner(user),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
