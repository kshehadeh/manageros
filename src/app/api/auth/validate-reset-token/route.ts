import { NextRequest, NextResponse } from 'next/server'
import { validatePasswordResetToken } from '@/lib/actions/password-reset'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  try {
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const validation = await validatePasswordResetToken(token)

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('Validate reset token error:', error)
    return NextResponse.json(
      { error: 'Failed to validate reset token' },
      { status: 500 }
    )
  }
}
