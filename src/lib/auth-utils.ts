import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

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
 */
export async function getFilteredNavigation() {
  const user = await getCurrentUser()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'Home' },
    { name: 'Initiatives', href: '/initiatives', icon: 'Rocket' },
    { name: 'People', href: '/people', icon: 'User' },
    { name: 'Teams', href: '/teams', icon: 'Users2' },
    { name: 'Tasks', href: '/tasks', icon: 'ListTodo' },
    { name: 'My Tasks', href: '/my-tasks', icon: 'CheckSquare' },
    { name: 'Meetings', href: '/meetings', icon: 'Calendar' },
    { name: 'Reports', href: '/reports', icon: 'BarChart3' },
    {
      name: 'Org Settings',
      href: '/organization/settings',
      icon: 'Building',
      adminOnly: true,
    },
    { name: 'Your Settings', href: '/settings', icon: 'Settings' },
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
  if (!user.personId) {
    return false
  }

  return user.personId === personId
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
