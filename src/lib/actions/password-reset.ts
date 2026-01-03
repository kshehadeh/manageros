'use server'

import { prisma } from '../db'

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
