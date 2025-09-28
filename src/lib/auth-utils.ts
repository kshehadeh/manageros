import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * Get the current authenticated user from the session
 * Throws an error if no user is authenticated
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session.user
}

/**
 * Check if the current user can generate/view synopses for a specific person
 * Returns true if:
 * 1. The user is generating synopses for their own linked person
 * 2. The user is an organization admin
 */
export async function canAccessSynopsesForPerson(
  personId: string
): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    return false
  }

  // Check if user is an organization admin
  if (user.role === 'ADMIN') {
    return true
  }

  // Check if user is generating synopses for their own linked person
  const currentPerson = await prisma.person.findFirst({
    where: { user: { id: user.id } },
    select: { id: true },
  })

  return currentPerson?.id === personId
}

/**
 * Custom sign out function that ensures proper cleanup
 */
export async function signOutWithCleanup() {
  // Clear any user-specific settings from localStorage
  if (typeof window !== 'undefined') {
    // We can't access the user ID here since we're signing out,
    // but we can clear all user settings by clearing localStorage
    // This is a fallback - the main cleanup happens in the signOut callback
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('user-settings-')) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Failed to clear user settings during sign out:', error)
    }
  }
}
