#!/usr/bin/env bun

import { cleanupExpiredResetTokens } from '../src/lib/actions/password-reset'

/**
 * Cleanup script for expired password reset tokens
 * Run this periodically (e.g., via cron job) to clean up expired tokens
 */
async function main() {
  try {
    console.log('Starting cleanup of expired password reset tokens...')

    const cleanedCount = await cleanupExpiredResetTokens()

    console.log(`Cleanup completed. Removed ${cleanedCount} expired tokens.`)
  } catch (error) {
    console.error('Error during cleanup:', error)
    process.exit(1)
  }
}

main()
