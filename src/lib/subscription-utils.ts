'use server'

import { prisma } from '@/lib/db'
import { getClerkClient } from './clerk'
import { Feature } from '@clerk/backend'
import { EntityName, EntityNameValues, PlanLimits } from './subscriptions'

export interface OrganizationSubscription {
  billingUserId: string | null
  subscriptionPlanId: string | null
  subscriptionPlanName: string | null
  subscriptionStatus: string | null
  limits: PlanLimits | null | undefined
  billingPeriod: 'month' | 'annual' | null
  periodStart: number | null
  periodEnd: number | null
  nextPaymentDate: number | null
  nextPaymentAmount: number | null
}

export async function getOrganizationLimits(
  organizationId: string
): Promise<PlanLimits | undefined | null> {
  const subscription = await getOrganizationSubscription(organizationId)
  if (!subscription) {
    return null
  }

  return subscription.limits
}

/**
 * Get subscription information for an organization
 * Fetches from Clerk organization billing API - Clerk is the source of truth
 * Returns subscription plan details, billing status, and payer (billing user) information
 */
export async function getOrganizationSubscription(
  organizationId: string
): Promise<OrganizationSubscription | null> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      clerkOrganizationId: true,
    },
  })

  if (!organization || !organization.clerkOrganizationId) {
    return null
  }

  try {
    const clerkClient = getClerkClient()
    const clerkSubscription =
      await clerkClient.billing.getOrganizationBillingSubscription(
        organization.clerkOrganizationId
      )

    if (
      clerkSubscription &&
      clerkSubscription.subscriptionItems &&
      clerkSubscription.subscriptionItems.length > 0 &&
      clerkSubscription.subscriptionItems[0]?.plan
    ) {
      const firstItem = clerkSubscription.subscriptionItems[0]
      const plan = firstItem.plan

      // Get billing user ID from Clerk's payer information
      // The payerId is on the subscription, and it's a Clerk user ID
      let billingUserId: string | null = null
      if (clerkSubscription.payerId) {
        // Find the user in our database by Clerk user ID
        const billingUser = await prisma.user.findUnique({
          where: { clerkUserId: clerkSubscription.payerId },
          select: { id: true },
        })
        if (billingUser) {
          billingUserId = billingUser.id
        }
      }

      const planLimits =
        plan?.features?.reduce((acc: PlanLimits, f: Feature) => {
          const [entity, limit] = f.slug.split('_') as [EntityName, string]
          if (!EntityNameValues.includes(entity)) {
            return acc
          }

          if (limit === 'unlimited') {
            acc[entity] = null
            return acc
          }

          try {
            acc[entity] = parseInt(limit)
          } catch {
            acc[entity] = null
          }

          return acc
        }, {} as PlanLimits) || null

      // Get next payment date - use subscription level nextPayment, or fallback to periodEnd
      // For recurring subscriptions, the next payment typically occurs at periodEnd
      const nextPaymentDate =
        clerkSubscription.nextPayment?.date || firstItem.periodEnd || null

      // Get next payment amount
      const nextPaymentAmount =
        typeof clerkSubscription.nextPayment?.amount === 'object'
          ? clerkSubscription.nextPayment.amount.amount
          : firstItem.nextPayment?.amount || null

      return {
        billingUserId: billingUserId,
        subscriptionPlanId: plan?.id || null,
        subscriptionPlanName: plan?.name || null,
        subscriptionStatus: clerkSubscription.status || 'active',
        limits: planLimits,
        billingPeriod: firstItem.planPeriod || null,
        periodStart: firstItem.periodStart || null,
        periodEnd: firstItem.periodEnd || null,
        nextPaymentDate,
        nextPaymentAmount,
      }
    }

    // No subscription items found - return null
    return null
  } catch (error) {
    // Handle 404 as "no subscription" rather than an error
    if (error instanceof Error && error.message.includes('404')) {
      return null
    }
    console.error('Error fetching Clerk organization subscription:', error)
    return null
  }
}

/**
 * Check if an organization can perform an action based on limits
 * Returns true if allowed, false if limit exceeded
 * Note: Per rule #10, users can still view existing entities even if over limit
 */
export async function checkOrganizationLimit(
  organizationId: string,
  entity: EntityName,
  currentCount: number
): Promise<boolean> {
  const subscription = await getOrganizationSubscription(organizationId)
  if (!subscription) {
    return true
  }
  const limits = subscription.limits
  if (!limits || !limits[entity]) {
    return true
  }
  return currentCount < limits[entity]
}

/**
 * Get current counts for an organization
 */
export async function getOrganizationCounts(
  organizationId: string
): Promise<PlanLimits> {
  const [peopleCount, initiativesCount, teamsCount, feedbackCampaignsCount] =
    await Promise.all([
      prisma.person.count({
        where: { organizationId },
      }),
      prisma.initiative.count({
        where: { organizationId },
      }),
      prisma.team.count({
        where: { organizationId },
      }),
      prisma.feedbackCampaign.count({
        where: {
          targetPerson: {
            organizationId,
          },
        },
      }),
    ])

  return {
    people: peopleCount,
    initiatives: initiativesCount,
    teams: teamsCount,
    feedbackcampaigns: feedbackCampaignsCount,
  }
}
