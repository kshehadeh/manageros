import { NextRequest, NextResponse } from 'next/server'
import { createPasswordResetToken } from '@/lib/actions/password-reset'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    await createPasswordResetToken(email)

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message:
        "If an account with that email exists, we've sent you a password reset link.",
    })
  } catch (error) {
    console.error('Forgot password error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}
