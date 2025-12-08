import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { getStandaloneNotes } from '@/lib/actions/notes'

export async function GET(_request: NextRequest) {
  const user = await getCurrentUser()
  try {
    if (!user.managerOSOrganizationId) {
      return NextResponse.json(
        { error: 'User must belong to an organization to view notes' },
        { status: 403 }
      )
    }

    const notes = await getStandaloneNotes()

    return NextResponse.json({
      notes,
      currentUserId: user.managerOSUserId,
      pagination: {
        page: 1,
        limit: notes.length,
        totalCount: notes.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
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
