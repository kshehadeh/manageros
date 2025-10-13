'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useBreadcrumb, type BreadcrumbItem } from './breadcrumb-provider'

const routeMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/initiatives': 'Initiatives',
  '/people': 'People',
  '/people/chart': 'Organization Chart',
  '/teams': 'Teams',
  '/tasks': 'Tasks',
  '/my-tasks': 'My Tasks',
  '/meetings': 'Meetings',
  '/oneonones': '1:1s',
  '/feedback': 'Feedback',
  '/reports': 'Reports',
  '/direct-reports': 'Direct Reports',
  '/organization/invitations': 'Invitations',
  '/organization/create': 'Create Organization',
  '/organization/settings': 'Settings',
  '/auth/signin': 'Sign In',
  '/auth/signup': 'Sign Up',
}

/**
 * Default breadcrumb handler that generates breadcrumbs from the URL path
 * This is used as a fallback when pages don't set custom breadcrumbs
 */
export function DefaultBreadcrumbHandler() {
  const pathname = usePathname()
  const { setBreadcrumbs } = useBreadcrumb()

  useEffect(() => {
    const generateBreadcrumbs = (): BreadcrumbItem[] => {
      const segments = pathname.split('/').filter(Boolean)
      const breadcrumbs: BreadcrumbItem[] = []

      // Only add Dashboard if we're not already on the dashboard
      if (pathname !== '/dashboard') {
        breadcrumbs.push({ name: 'Dashboard', href: '/dashboard' })
      }

      let currentPath = ''

      segments.forEach(segment => {
        currentPath += `/${segment}`

        // Handle dynamic routes (like [id])
        // Match MongoDB ObjectIds (24 hex chars) or CUIDs (starts with 'c' and is 25 chars)
        const isMongoId = segment.match(/^[a-f0-9]{24}$/)
        const isCuid = segment.match(/^c[a-z0-9]{24}$/)

        if (isMongoId || isCuid) {
          // This looks like an ID, treat as dynamic
          const parentPath = currentPath.replace(`/${segment}`, '')
          const parentName = routeMap[parentPath] || segment
          breadcrumbs.push({
            name: `${parentName} Details`,
            href: currentPath,
            isLoading: true, // Mark ID segments as loading
          })
        } else {
          const name =
            routeMap[currentPath] ||
            segment.charAt(0).toUpperCase() + segment.slice(1)
          breadcrumbs.push({
            name,
            href: currentPath,
          })
        }
      })

      return breadcrumbs
    }

    setBreadcrumbs(generateBreadcrumbs())
  }, [pathname, setBreadcrumbs])

  return null
}
