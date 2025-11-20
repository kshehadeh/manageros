'use server'

import { prisma } from '@/lib/db'
import {
  ClerkBillingPlansResponse,
  ClerkCommercePlan,
  ClerkCommerceSubscription,
} from './clerk-types'
import { getClerkOrganizationSubscription } from './clerk-organization-utils'

export interface PlanLimits {
  maxPeople: number | null // null = unlimited
  maxInitiatives: number | null
  maxTeams: number | null
  maxFeedbackCampaigns: number | null
}

export interface OrganizationSubscription {
  billingUserId: string | null
  subscriptionPlanId: string | null
  subscriptionPlanName: string | null
  subscriptionStatus: string | null
}

export async function getUserSubscriptionInfo(
  userId: string
): Promise<ClerkCommerceSubscription | undefined> {
  // fetch this information directly from clerk
  const response = await fetch(
    `https://api.clerk.com/v1/users/${userId}/billing/subscription`,
    {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    }
  )
  const data = (await response.json()) as ClerkCommerceSubscription
  return data
}

export async function getSubscriptionInformation(
  planId: string
): Promise<ClerkCommercePlan | undefined> {
  // fetch this information directly from clerk
  const response = await fetch(
    `https://api.clerk.com/v1/billing/plans?limit=100`,
    {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    }
  )
  const data = (await response.json()) as ClerkBillingPlansResponse
  const plan = data.data.find((plan: ClerkCommercePlan) => plan.id === planId)
  return plan
}
/**
 * Get plan limits based on plan name
 * Returns limit configuration for each plan type
 */
export async function getPlanLimits(
  planName: string | null | undefined
): Promise<PlanLimits> {
  // Default to free tier limits if no plan specified
  if (!planName || planName === 'free' || planName === 'Solo') {
    return {
      maxPeople: null,
      maxInitiatives: null,
      maxTeams: null,
      maxFeedbackCampaigns: null,
    }
  }

  // Orchestrator plan has unlimited everything
  if (planName === 'Team') {
    return {
      maxPeople: null,
      maxInitiatives: null,
      maxTeams: null,
      maxFeedbackCampaigns: null,
    }
  }

  // Unknown plan - default to free tier limits
  return {
    maxPeople: null,
    maxInitiatives: null,
    maxTeams: null,
    maxFeedbackCampaigns: null,
  }
}

/**
 * Get subscription information for an organization
 * Fetches from Clerk organization billing API if available, including:
 * - Subscription plan details
 * - Billing status
 * - Payer (billing user) information
 * Falls back to stored data if Clerk API is unavailable
 */
export async function getOrganizationSubscription(
  organizationId: string
): Promise<OrganizationSubscription | null> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      billingUserId: true,
      clerkOrganizationId: true,
      subscriptionPlanId: true,
      subscriptionPlanName: true,
      subscriptionStatus: true,
    },
  })

  if (!organization) {
    return null
  }

  // If organization has a Clerk organization ID, fetch subscription from Clerk
  if (organization.clerkOrganizationId) {
    try {
      const clerkSubscription = await getClerkOrganizationSubscription(
        organization.clerkOrganizationId
      )

      if (
        clerkSubscription &&
        clerkSubscription.subscription_items &&
        clerkSubscription.subscription_items.length > 0 &&
        clerkSubscription.subscription_items[0]?.plan
      ) {
        const firstItem = clerkSubscription.subscription_items[0]
        const plan = firstItem.plan

        // Get billing user ID from Clerk's payer information
        let billingUserId = organization.billingUserId
        if (firstItem.payer?.user_id) {
          // Try to find the user in our database by Clerk user ID
          const billingUser = await prisma.user.findUnique({
            where: { clerkUserId: firstItem.payer.user_id },
            select: { id: true },
          })
          if (billingUser) {
            billingUserId = billingUser.id
          }
        }

        // Update stored subscription info from Clerk (async, don't wait)
        prisma.organization
          .update({
            where: { id: organizationId },
            data: {
              billingUserId: billingUserId,
              subscriptionPlanId: plan?.id || null,
              subscriptionPlanName: plan?.name || null,
              subscriptionStatus: clerkSubscription.status || 'active',
            },
          })
          .catch(error => {
            console.error(
              'Failed to update organization subscription from Clerk:',
              error
            )
          })

        return {
          billingUserId: billingUserId,
          subscriptionPlanId: plan?.id || null,
          subscriptionPlanName: plan?.name || null,
          subscriptionStatus: clerkSubscription.status || 'active',
        }
      }
    } catch (error) {
      console.error('Error fetching Clerk organization subscription:', error)
      // Fall through to return stored data
    }
  }

  // Fallback to stored subscription data
  return {
    billingUserId: organization.billingUserId,
    subscriptionPlanId: organization.subscriptionPlanId,
    subscriptionPlanName: organization.subscriptionPlanName,
    subscriptionStatus: organization.subscriptionStatus,
  }
}

/**
 * Get organization limits based on subscription
 */
export async function getOrganizationLimits(
  organizationId: string
): Promise<PlanLimits> {
  const subscription = await getOrganizationSubscription(organizationId)
  return await getPlanLimits(subscription?.subscriptionPlanName)
}

/**
 * Check if an organization can perform an action based on limits
 * Returns true if allowed, false if limit exceeded
 * Note: Per rule #10, users can still view existing entities even if over limit
 */
export async function checkOrganizationLimit(
  organizationId: string,
  limitType: keyof PlanLimits,
  currentCount: number
): Promise<{ allowed: boolean; limit: number | null; message?: string }> {
  const limits = await getOrganizationLimits(organizationId)
  const limit = limits[limitType]

  // null means unlimited
  if (limit === null) {
    return { allowed: true, limit: null }
  }

  // Check if current count exceeds limit
  if (currentCount >= limit) {
    const limitTypeLabels: Record<keyof PlanLimits, string> = {
      maxPeople: 'people',
      maxInitiatives: 'initiatives',
      maxTeams: 'teams',
      maxFeedbackCampaigns: 'feedback campaigns',
    }

    return {
      allowed: false,
      limit,
      message: `You have reached the limit of ${limit} ${limitTypeLabels[limitType]} for your subscription plan. Please upgrade your plan to add more.`,
    }
  }

  return { allowed: true, limit }
}

/**
 * Get current counts for an organization
 */
export async function getOrganizationCounts(organizationId: string) {
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
    feedbackCampaigns: feedbackCampaignsCount,
  }
}
