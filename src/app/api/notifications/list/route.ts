import { NextRequest, NextResponse } from 'next/server'
import { getAllUserNotifications } from '@/lib/actions/notification'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  try {
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const showAll = searchParams.get('showAll') === 'true'

    const result = await getAllUserNotifications(page, limit, showAll)

    return NextResponse.json({
      notifications: result.notifications,
      pagination: {
        page: result.currentPage,
        limit,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        hasNextPage: result.currentPage < result.totalPages,
        hasPreviousPage: result.currentPage > 1,
      },
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
