'use server'

import { getCurrentUser } from '@/lib/auth-utils'
import { getOrganizationSubscription } from '@/lib/subscription-utils'
import type { OrganizationSubscription } from '@/lib/subscription-utils'

/**
 * Server action to get organization subscription information
 * This wraps the server-only getOrganizationSubscription function
 * so it can be called from client components
 *
 * Security: Verifies that the user is authenticated and belongs to the requested organization
 */
export async function getOrganizationSubscriptionAction(
  organizationId: string
): Promise<OrganizationSubscription | null> {
  // Authenticate user
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to view subscription information'
    )
  }

  // Verify that the requested organizationId matches the user's organizationId
  // This prevents users from accessing other organizations' subscription data
  if (organizationId !== user.managerOSOrganizationId) {
    throw new Error('Organization subscription not found or access denied')
  }

  return await getOrganizationSubscription(organizationId)
}
