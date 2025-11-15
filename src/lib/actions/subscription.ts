'use server'

import { getOrganizationSubscription } from '@/lib/subscription-utils'
import type { OrganizationSubscription } from '@/lib/subscription-utils'

/**
 * Server action to get organization subscription information
 * This wraps the server-only getOrganizationSubscription function
 * so it can be called from client components
 */
export async function getOrganizationSubscriptionAction(
  organizationId: string
): Promise<OrganizationSubscription | null> {
  return await getOrganizationSubscription(organizationId)
}
