import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { getUnreadNotificationCount } from '@/lib/actions/notification'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const count = await getUnreadNotificationCount()

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching notification count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification count' },
      { status: 500 }
    )
  }
}
