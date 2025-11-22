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

/**
 * Get all billing plans from Clerk
 */
export async function getAllClerkPlans(): Promise<ClerkCommercePlan[]> {
  if (!process.env.CLERK_SECRET_KEY) {
    return []
  }

  try {
    const response = await fetch(
      `https://api.clerk.com/v1/billing/plans?limit=100`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch Clerk plans:', response.status)
      return []
    }

    const data = (await response.json()) as ClerkBillingPlansResponse
    return data.data || []
  } catch (error) {
    console.error('Error fetching Clerk plans:', error)
    return []
  }
}

/**
 * Get a specific plan by ID from Clerk
 */
export async function getSubscriptionInformation(
  planId: string
): Promise<ClerkCommercePlan | undefined> {
  const plans = await getAllClerkPlans()
  return plans.find((plan: ClerkCommercePlan) => plan.id === planId)
}

/**
 * Get the free plan from Clerk
 * A free plan is defined as one with fee.amount === 0
 * Falls back to the default plan if no free plan is found
 */
export async function getFreePlanFromClerk(): Promise<ClerkCommercePlan | null> {
  const plans = await getAllClerkPlans()

  if (plans.length === 0) {
    return null
  }

  // First, try to find a plan with $0 fee
  const freePlan = plans.find(
    plan => plan.fee.amount === 0 || plan.fee.amount === 0.0
  )

  if (freePlan) {
    return freePlan
  }

  // Fallback to the default plan if no free plan found
  const defaultPlan = plans.find(plan => plan.is_default === true)

  return defaultPlan || null
}
/**
 * Get plan limits based on plan name
 * Returns limit configuration for each plan type
 * Fetches plan information from Clerk to determine if it's a free plan
 */
export async function getPlanLimits(
  planName: string | null | undefined
): Promise<PlanLimits> {
  // Default to free tier limits if no plan specified
  if (!planName || planName === 'free') {
    return {
      maxPeople: null,
      maxInitiatives: null,
      maxTeams: null,
      maxFeedbackCampaigns: null,
    }
  }

  // Fetch all plans from Clerk to check if this is a free plan
  const plans = await getAllClerkPlans()
  const plan = plans.find(p => p.name === planName)

  // If plan is found and has $0 fee, treat as free plan with unlimited limits
  if (plan && plan.fee.amount === 0) {
    return {
      maxPeople: null,
      maxInitiatives: null,
      maxTeams: null,
      maxFeedbackCampaigns: null,
    }
  }

  // For paid plans or unknown plans, default to unlimited
  // In the future, plan limits could be stored in Clerk plan features or metadata
  return {
    maxPeople: null,
    maxInitiatives: null,
    maxTeams: null,
    maxFeedbackCampaigns: null,
  }
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
      let billingUserId: string | null = null
      if (firstItem.payer?.user_id) {
        // Find the user in our database by Clerk user ID
        const billingUser = await prisma.user.findUnique({
          where: { clerkUserId: firstItem.payer.user_id },
          select: { id: true },
        })
        if (billingUser) {
          billingUserId = billingUser.id
        }
      }

      return {
        billingUserId: billingUserId,
        subscriptionPlanId: plan?.id || null,
        subscriptionPlanName: plan?.name || null,
        subscriptionStatus: clerkSubscription.status || 'active',
      }
    }

    // No subscription items found - return null
    return null
  } catch (error) {
    console.error('Error fetching Clerk organization subscription:', error)
    return null
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
