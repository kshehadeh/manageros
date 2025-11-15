import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'

export async function GET() {
  try {
    const user = await getCurrentUser()
    return NextResponse.json(
      { user },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
