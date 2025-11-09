import { NextResponse } from 'next/server'
import { getPendingInvitationsForUser } from '@/lib/actions/organization'
import { getCurrentUser } from '../../../../lib/auth-utils'

export async function GET() {
  const user = await getCurrentUser()

  try {
    const invitations = await getPendingInvitationsForUser(user?.email || null)
    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}
