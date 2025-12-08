import { NextRequest, NextResponse } from 'next/server'
import {
  getCurrentUser,
  getActionPermission,
  PermissionType,
} from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') as PermissionType
    const id = searchParams.get('id')

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter is required' },
        { status: 400 }
      )
    }

    const hasPermission = await getActionPermission(
      user,
      action,
      id || undefined
    )

    return NextResponse.json({ hasPermission })
  } catch (error) {
    console.error('Error checking permission:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to check permission',
      },
      { status: 500 }
    )
  }
}
