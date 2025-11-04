import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import {
  getUnreadNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markNotificationAsDismissed,
} from '@/lib/actions/notification'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  try {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (type === 'unread') {
      const notifications = await getUnreadNotifications(limit)
      const count = await getUnreadNotificationCount()

      return NextResponse.json({
        notifications,
        unreadCount: count,
      })
    }

    return NextResponse.json(
      { error: 'Invalid type parameter' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId, action } = body

    if (!notificationId || !action) {
      return NextResponse.json(
        { error: 'Missing notificationId or action' },
        { status: 400 }
      )
    }

    let result
    switch (action) {
      case 'read':
        result = await markNotificationAsRead(notificationId)
        break
      case 'dismiss':
        result = await markNotificationAsDismissed(notificationId)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}
