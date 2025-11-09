import { NextResponse } from 'next/server'
import { getPendingInvitationsForUser } from '@/lib/actions/organization'
import { getOptionalUser } from '../../../../lib/auth-utils'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  const user = await getOptionalUser()

  if (user?.email) {
    const invitations = await getPendingInvitationsForUser(user.email)
    return NextResponse.json({ invitations })
  }

  try {
    // Fallback: try to get email from session claims
    const authResult = await auth({ treatPendingAsSignedOut: false })
    const { sessionClaims } = authResult

    if (sessionClaims?.email) {
      const email = sessionClaims.email as string
      const invitations = await getPendingInvitationsForUser(email)
      return NextResponse.json({ invitations })
    }

    // No user or email found, return empty array
    return NextResponse.json({ invitations: [] })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations', invitations: [] },
      { status: 500 }
    )
  }
}
