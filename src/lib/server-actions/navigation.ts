'use server'

import { getCurrentUser } from '@/lib/auth-utils'
import { cacheLife, cacheTag } from 'next/cache'

/**
 * Get navigation items filtered by user permissions
 * This ensures server-side security for navigation filtering
 * Uses "use cache" for persistent global caching
 */
export async function getFilteredNavigation() {
  'use cache'

  const user = await getCurrentUser()

  cacheLife('hours') // Navigation doesn't change frequently
  cacheTag(`navigation-user-${user.id}`)
  if (user.organizationId) {
    cacheTag(`navigation-org-${user.organizationId}`)
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
