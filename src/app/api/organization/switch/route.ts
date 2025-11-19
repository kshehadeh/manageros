import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user.clerkUserId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { organizationId } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Set the active organization for the user's session in Clerk
    const client = await clerkClient()

    // Verify the user is a member of this organization
    const orgMemberships = await client.users.getOrganizationMembershipList({
      userId: user.clerkUserId,
    })

    const isMember = orgMemberships.data.some(
      membership => membership.organization.id === organizationId
    )

    if (!isMember) {
      return NextResponse.json(
        { error: 'User is not a member of this organization' },
        { status: 403 }
      )
    }

    // The actual organization switching will be handled by Clerk on the client side
    // This endpoint just validates the request
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error switching organization:', error)
    return NextResponse.json(
      { error: 'Failed to switch organization' },
      { status: 500 }
    )
  }
}
