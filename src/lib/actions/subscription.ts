'use server'

import { getCurrentUser } from '@/lib/auth-utils'
import {
  getOrganizationSubscription,
  getOrganizationCounts,
  type OrganizationSubscription,
  type PlanLimits,
  getOrganizationLimits,
} from '@/lib/subscription-utils'
import { EntityName } from '../subscriptions'

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

export interface PlanLimitsAndCounts {
  limits: PlanLimits | null | undefined
  counts: Record<EntityName, number>
  subscription: OrganizationSubscription | null
}

/**
 * Server action to get organization plan limits and entity counts
 * This wraps the server-only functions so they can be called from client components
 *
 * Security: Verifies that the user is authenticated and belongs to the requested organization
 */
export async function getPlanLimitsAndCountsAction(
  organizationId: string
): Promise<PlanLimitsAndCounts | null> {
  // Authenticate user
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to view plan limits and counts'
    )
  }

  // Verify that the requested organizationId matches the user's organizationId
  // This prevents users from accessing other organizations' data
  if (organizationId !== user.managerOSOrganizationId) {
    throw new Error('Plan limits and counts not found or access denied')
  }

  const [limits, counts, subscription] = await Promise.all([
    getOrganizationLimits(organizationId),
    getOrganizationCounts(organizationId),
    getOrganizationSubscription(organizationId),
  ])

  return {
    limits,
    counts,
    subscription,
  }
}
