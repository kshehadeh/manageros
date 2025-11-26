import { NextResponse } from 'next/server'
import { getPendingInvitationsForUser } from '@/lib/clerk'
import { getCurrentUser } from '../../../../lib/auth-utils'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (user.clerkUserId) {
      const invitations = await getPendingInvitationsForUser(user.clerkUserId)
      return NextResponse.json({ invitations })
    }

    // No Clerk user ID found, return empty array
    return NextResponse.json({ invitations: [] })
  } catch {
    // User not authenticated, return empty array
    return NextResponse.json({ invitations: [] })
  }
}
