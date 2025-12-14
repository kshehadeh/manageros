import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { getClerkOrganization } from '@/lib/clerk'
import { clerkClient } from '@clerk/nextjs/server'

export async function GET() {
  const user = await getCurrentUser()
  try {
    if (!user.clerkUserId) {
      return NextResponse.json({ organizations: [] })
    }

    // Get all organizations the user is a member of from Clerk
    const client = await clerkClient()
    const orgMemberships = await client.users.getOrganizationMembershipList({
      userId: user.clerkUserId,
    })

    // Fetch organization details for each membership
    const organizations = await Promise.all(
      orgMemberships.data.map(async membership => {
        const org = await getClerkOrganization(membership.organization.id)
        return {
          id: membership.organization.id,
          name: org?.name || membership.organization.name,
          slug: org?.slug || membership.organization.slug,
        }
      })
    )

    return NextResponse.json({ organizations })
  } catch (error) {
    // Check if this is a 404 error (user not found in Clerk)
    // This can happen when the database has stale clerkUserId references
    const isNotFoundError =
      error &&
      typeof error === 'object' &&
      'status' in error &&
      error.status === 404
    if (!isNotFoundError) {
      console.error('Error fetching organizations:', error)
    }
    // User not authenticated or error occurred, return empty array
    return NextResponse.json({ organizations: [] })
  }
}
