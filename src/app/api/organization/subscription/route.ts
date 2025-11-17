import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { getOrganizationSubscription } from '@/lib/subscription-utils'

/**
 * API endpoint to check if an organization has an active subscription
 * Returns subscription info if available
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth()
  try {
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getCurrentUser()

    if (!user.managerOSOrganizationId) {
      return NextResponse.json(
        { error: 'User does not belong to an organization' },
        { status: 403 }
      )
    }

    // Get organizationId from query params or use user's organization
    const searchParams = request.nextUrl.searchParams
    const organizationId =
      searchParams.get('organizationId') || user.managerOSOrganizationId

    // Verify user has access to this organization
    if (organizationId !== user.managerOSOrganizationId) {
      return NextResponse.json(
        { error: 'Access denied to this organization' },
        { status: 403 }
      )
    }

    const subscription = await getOrganizationSubscription(organizationId)

    if (!subscription) {
      return NextResponse.json({ subscription: null })
    }

    return NextResponse.json({
      subscription: {
        planId: subscription.subscriptionPlanId,
        status: subscription.subscriptionStatus,
        planName: subscription.subscriptionPlanName,
      },
    })
  } catch (error) {
    console.error('Error in organization subscription check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
