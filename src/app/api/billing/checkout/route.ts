import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API route to handle Clerk billing checkout
 *
 * This route redirects users to Clerk's billing checkout flow.
 *
 * To set up:
 * 1. Enable billing in your Clerk Dashboard
 * 2. Create your plans (Solo and Orchestrator) in Clerk Dashboard
 * 3. Set NEXT_PUBLIC_CLERK_ORCHESTRATOR_PLAN_ID in your .env file with the plan ID from Clerk
 *
 * For more information, see: https://clerk.com/docs/guides/billing/overview
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('redirect_url', request.url)
      return NextResponse.redirect(signInUrl)
    }

    const searchParams = request.nextUrl.searchParams
    const planId = searchParams.get('planId')

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    // Clerk billing checkout URL format
    // This will redirect to Clerk's hosted checkout page for the specified plan
    // The exact URL format may vary - check Clerk's billing documentation
    const clerkAppId =
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.split('_')[1]

    if (!clerkAppId) {
      return NextResponse.json(
        { error: 'Clerk configuration error' },
        { status: 500 }
      )
    }

    // Construct the Clerk billing checkout URL
    // Note: Adjust this URL based on Clerk's actual billing API endpoint
    // You may need to use Clerk's REST API or SDK methods to create a checkout session
    const checkoutUrl = `https://clerk.com/apps/${clerkAppId}/billing/checkout?planId=${planId}&userId=${userId}`

    // Alternative: If Clerk provides a billing portal URL, use that instead
    // const billingPortalUrl = `https://clerk.com/apps/${clerkAppId}/billing?planId=${planId}`

    return NextResponse.redirect(checkoutUrl)
  } catch (error) {
    console.error('Billing checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate checkout' },
      { status: 500 }
    )
  }
}
