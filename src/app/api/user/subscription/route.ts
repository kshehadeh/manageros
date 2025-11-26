import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getUserSubscription } from '@/lib/clerk'

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

    try {
      // Fetch user's subscriptions from Clerk
      const subscription = await getUserSubscription(userId)

      if (!subscription) {
        // If no subscriptions endpoint or user has no subscriptions, return null
        return NextResponse.json({ subscription: null })
      }

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
