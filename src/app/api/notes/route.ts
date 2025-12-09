import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { getAllNotes } from '@/lib/actions/notes'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  try {
    if (!user.managerOSOrganizationId) {
      return NextResponse.json(
        { error: 'User must belong to an organization to view notes' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const entityTypeParam = searchParams.get('entityType')

    // Parse entityType filter
    let entityTypes: string[] | undefined
    if (entityTypeParam) {
      entityTypes = entityTypeParam.split(',').filter(Boolean)
    }

    const { notes, totalCount } = await getAllNotes({
      page,
      limit,
      search: search || undefined,
      entityType: entityTypes,
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      notes,
      currentUserId: user.managerOSUserId,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch notes',
      },
      { status: 500 }
    )
  }
}
