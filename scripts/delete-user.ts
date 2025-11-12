#!/usr/bin/env bun

/**
 * Development script to delete a user from the database and Clerk
 *
 * Usage:
 *   bun scripts/delete-user.ts <email|userId>
 *
 * Examples:
 *   bun scripts/delete-user.ts user@example.com
 *   bun scripts/delete-user.ts clxxxxx
 *
 * WARNING: This script is for development use only!
 */

import { prisma } from '../src/lib/db'

// Check if we're in development
if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: This script can only be run in development mode!')
  console.error('Set NODE_ENV to "development" or unset it to use this script.')
  process.exit(1)
}

/**
 * Delete a Clerk user by ID
 */
async function deleteClerkUser(clerkUserId: string) {
  const apiKey = process.env.CLERK_SECRET_KEY
  const baseUrl = process.env.CLERK_API_URL || 'https://api.clerk.com/v1'

  if (!apiKey) {
    console.warn(
      'WARNING: CLERK_SECRET_KEY not set. Skipping Clerk user deletion.'
    )
    return false
  }

  try {
    const response = await fetch(`${baseUrl}/users/${clerkUserId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok && response.status !== 404) {
      const error = await response.text()
      throw new Error(
        `Failed to delete Clerk user: ${response.status} ${error}`
      )
    }

    return true
  } catch (error) {
    console.error(`Error deleting Clerk user ${clerkUserId}:`, error)
    return false
  }
}

/**
 * Main function to delete a user
 */
async function deleteUser(identifier: string) {
  try {
    console.log(`Looking up user: ${identifier}`)

    // Try to find user by email or ID
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { id: identifier },
          { clerkUserId: identifier },
        ],
      },
      include: {
        person: {
          select: {
            id: true,
            name: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!user) {
      console.error(`User not found: ${identifier}`)
      process.exit(1)
    }

    console.log(`Found user:`)
    console.log(`  ID: ${user.id}`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Name: ${user.name}`)
    console.log(`  Clerk User ID: ${user.clerkUserId || 'N/A'}`)
    console.log(`  Organization: ${user.organization?.name || 'N/A'}`)
    console.log(`  Person: ${user.person?.name || 'N/A'}`)

    // Unlink person if linked
    if (user.personId) {
      console.log(
        `\nUnlinking user from person: ${user.person?.name} (${user.personId})`
      )
      await prisma.user.update({
        where: { id: user.id },
        data: { personId: null },
      })
      console.log('✓ Person unlinked')
    }

    // Delete Clerk user if exists
    if (user.clerkUserId) {
      console.log(`\nDeleting Clerk user: ${user.clerkUserId}`)
      const clerkDeleted = await deleteClerkUser(user.clerkUserId)
      if (clerkDeleted) {
        console.log('✓ Clerk user deleted')
      } else {
        console.log('⚠ Clerk user deletion skipped or failed')
      }
    } else {
      console.log('\nNo Clerk user ID found, skipping Clerk deletion')
    }

    // Delete database user
    console.log(`\nDeleting database user: ${user.id}`)
    await prisma.user.delete({
      where: { id: user.id },
    })
    console.log('✓ Database user deleted')

    console.log('\n✓ User deletion completed successfully!')
  } catch (error) {
    console.error('Error deleting user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Main execution
const identifier = process.argv[2]

if (!identifier) {
  console.error('Usage: bun scripts/delete-user.ts <email|userId|clerkUserId>')
  console.error('\nExamples:')
  console.error('  bun scripts/delete-user.ts user@example.com')
  console.error('  bun scripts/delete-user.ts clxxxxx')
  console.error('  bun scripts/delete-user.ts user_xxxxx')
  process.exit(1)
}

deleteUser(identifier)
