'use server'

import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'
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
    {
      name: 'Reports',
      href: '/reports',
      icon: 'BarChart3',
      requiresPermission: 'report.access',
    },
    {
      name: 'Org Settings',
      href: '/organization/settings',
      icon: 'Building',
      adminOnly: true,
    },
  ]

  // Filter navigation based on organization membership and admin role
  const filteredNavigation = await Promise.all(
    navigation.map(async item => {
      // If user has no organization, only show Dashboard
      if (!user.organizationId) {
        return item.href === '/dashboard' ? item : null
      }

      // Check permission-based access
      if (item.requiresPermission) {
        const hasPermission = await getActionPermission(
          user,
          item.requiresPermission
        )
        if (!hasPermission) {
          return null
        }
      }

      // If user has organization, filter by admin role for admin-only items
      if (item.adminOnly && user.role !== 'ADMIN') {
        return null
      }

      return item
    })
  )

  return filteredNavigation.filter(
    (item): item is NonNullable<typeof item> => item !== null
  )
}
