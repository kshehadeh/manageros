import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/**
 * API endpoint to check if the current user has an active subscription
 * Returns subscription info if available
 */
export async function GET() {
  const { userId } = await auth()
  try {
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use Clerk's REST API to check subscription status
    // Note: This requires CLERK_SECRET_KEY to be set
    const clerkSecretKey = process.env.CLERK_SECRET_KEY

    if (!clerkSecretKey) {
      return NextResponse.json(
        { error: 'Clerk not configured' },
        { status: 500 }
      )
    }

    try {
      // Fetch user's subscriptions from Clerk
      const response = await fetch(
        `https://api.clerk.com/v1/users/${userId}/billing/subscription`,
        { headers: { Authorization: `Bearer ${clerkSecretKey}` } }
      )

      if (!response.ok) {
        // If no subscriptions endpoint or user has no subscriptions, return null
        return NextResponse.json({ subscription: null })
      }

      const subscription = await response.json()

      // Check if subscription is active
      if (
        subscription?.status === 'active' &&
        subscription?.subscription_items
      ) {
        // Find the first active subscription item
        const activeItem = Array.isArray(subscription.subscription_items)
          ? subscription.subscription_items.find(
              (item: { status?: string }) => item.status === 'active'
            )
          : null

        if (activeItem && activeItem.plan_id) {
          return NextResponse.json({
            subscription: {
              planId: activeItem.plan_id,
              status: subscription.status,
              planName: activeItem.plan?.name || null,
            },
          })
        }
      }

      return NextResponse.json({ subscription: null })
    } catch (error) {
      // If Clerk API call fails, return null (user might not have subscription)
      console.error('Error fetching subscription from Clerk:', error)
      return NextResponse.json({ subscription: null })
    }
  } catch (error) {
    console.error('Error in subscription check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
