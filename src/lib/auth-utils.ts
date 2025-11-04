import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

/**
 * Get the current authenticated user from the session
 * Throws an error if no user is authenticated
 * Use this for server actions and components that must have authentication
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session.user
}

/**
 * Get the current authenticated user from the session
 * Returns null if no user is authenticated (does not throw)
 * Use this for server components wrapped in Suspense to enable static rendering
 */
export async function getOptionalUser() {
  const session = await getServerSession(authOptions)
  return session?.user ?? null
}

/**
 * Require authentication with optional organization requirement
 * This is the standard way to handle authorization in page components
 */
export async function requireAuth(options?: {
  requireOrganization?: boolean
  redirectTo?: string
}) {
  const user = await getCurrentUser()

  if (options?.requireOrganization && !user.organizationId) {
    redirect(options.redirectTo || '/organization/create')
  }

  return user
}

/**
 * Get navigation items filtered by user permissions
 * This ensures server-side security for navigation filtering
 * Returns empty array if user is not authenticated (for use in Suspense boundaries)
 */
export async function getFilteredNavigation() {
  const user = await getOptionalUser()

  if (!user) {
    return []
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'Home' },
    { name: 'My Tasks', href: '/my-tasks', icon: 'CheckSquare' },
    { name: 'Initiatives', href: '/initiatives', icon: 'Rocket' },
    { name: 'Reports', href: '/reports', icon: 'BarChart3' },
    {
      name: 'Org Settings',
      href: '/organization/settings',
      icon: 'Building',
      adminOnly: true,
    },
  ]

  // Filter navigation based on organization membership and admin role
  return navigation.filter(item => {
    // If user has no organization, only show Dashboard
    if (!user.organizationId) {
      return item.href === '/dashboard'
    }

    // If user has organization, filter by admin role for admin-only items
    return !item.adminOnly || user.role === 'ADMIN'
  })
}

/**
 * Check if the current user can access overviews/synopses for a person.
 * Access is granted if:
 * 1. The user is linked to the person themselves
 * 2. The user is a manager (direct or indirect) of that person
 */
export async function canAccessSynopsesForPerson(
  personId: string
): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user.organizationId || !user.personId) {
    return false
  }

  // Check if user is linked to the person themselves
  if (user.personId === personId) {
    return true
  }

  // Check if user is a manager (direct or indirect) of that person
  const { checkIfManagerOrSelf } = await import('@/lib/utils/people-utils')
  return await checkIfManagerOrSelf(user.personId, personId)
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
