import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { getUnreadNotificationCount } from '@/lib/actions/notification'

export async function GET(_request: NextRequest) {
  const user = await getCurrentUser()
  try {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const count = await getUnreadNotificationCount()

    return NextResponse.json({
      count,
      timestamp: new Date().toISOString(),
      userId: user.id,
    })
  } catch (error) {
    console.error('Error fetching notification count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification count' },
      { status: 500 }
    )
  }
}
