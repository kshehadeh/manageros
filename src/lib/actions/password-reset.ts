'use server'

import { prisma } from '../db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

/**
 * Generate a secure random token for password reset
 */
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create a password reset token for the given email
 */
export async function createPasswordResetToken(email: string) {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      // Don't reveal if user exists or not for security
      return { success: true }
    }

    // Generate token and expiration (1 hour from now)
    const token = generateResetToken()
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() },
    })

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expires,
      },
    })

    // Note: Password reset emails are now handled by Clerk
    // This token creation is kept for backward compatibility if needed

    return { success: true }
  } catch (error) {
    console.error('Error creating password reset token:', error)
    throw new Error('Failed to create password reset token')
  }
}

/**
 * Validate a password reset token
 */
export async function validatePasswordResetToken(token: string) {
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return { valid: false, error: 'Invalid reset token' }
    }

    if (resetToken.expires < new Date()) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      })
      return { valid: false, error: 'Reset token has expired' }
    }

    return { valid: true }
  } catch (error) {
    console.error('Error validating password reset token:', error)
    return { valid: false, error: 'Failed to validate reset token' }
  }
}

/**
 * Reset password using a valid reset token
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
) {
  try {
    // Validate token
    const tokenValidation = await validatePasswordResetToken(token)
    if (!tokenValidation.valid) {
      throw new Error(tokenValidation.error)
    }

    // Get the reset token record
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      throw new Error('Invalid reset token')
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12)

    // Update user password
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { passwordHash },
    })

    // Delete the used reset token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    })

    return { success: true }
  } catch (error) {
    console.error('Error resetting password:', error)
    throw new Error(
      error instanceof Error ? error.message : 'Failed to reset password'
    )
  }
}

/**
 * Clean up expired password reset tokens
 */
export async function cleanupExpiredResetTokens() {
  try {
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    })

    console.log(`Cleaned up ${result.count} expired password reset tokens`)
    return result.count
  } catch (error) {
    console.error('Error cleaning up expired reset tokens:', error)
    return 0
  }
}
