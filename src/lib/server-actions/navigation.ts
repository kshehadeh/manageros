'use server'

import {
  getCurrentUser,
  getActionPermission,
  isAdminOrOwner,
  PermissionType,
} from '@/lib/auth-utils'
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
  cacheTag(`navigation-user-${user.managerOSUserId}`)
  if (user.managerOSOrganizationId) {
    cacheTag(`navigation-org-${user.managerOSOrganizationId}`)
  }

  interface NavigationItem {
    name: string
    href: string
    icon: string
    requiresPermission?: PermissionType
    adminOnly?: boolean
  }

  const navigation: NavigationItem[] = [
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
      name: 'Manage Users',
      href: '/organization/settings',
      icon: 'Users',
      adminOnly: true,
    },
  ]

  // Filter navigation based on organization membership and admin role
  const filteredNavigation = await Promise.all(
    navigation.map(async item => {
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
      if (item.adminOnly && !isAdminOrOwner(user)) {
        return null
      }

      return item
    })
  )

  return filteredNavigation.filter(
    (item): item is NonNullable<typeof item> => item !== null
  )
}
