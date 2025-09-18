'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useBreadcrumb } from './breadcrumb-provider'

interface BreadcrumbItem {
  name: string
  href: string
}

const routeMap: Record<string, string> = {
  '/': 'Dashboard',
  '/initiatives': 'Initiatives',
  '/people': 'People',
  '/teams': 'Teams',
  '/tasks': 'Tasks',
  '/oneonones': '1:1s',
  '/feedback': 'Feedback',
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
      const breadcrumbs: BreadcrumbItem[] = [{ name: 'Dashboard', href: '/' }]

      let currentPath = ''

      segments.forEach(segment => {
        currentPath += `/${segment}`

        // Handle dynamic routes (like [id])
        if (segment.match(/^[a-f0-9]{24}$/)) {
          // This looks like a MongoDB ObjectId, treat as dynamic
          const parentPath = currentPath.replace(`/${segment}`, '')
          const parentName = routeMap[parentPath] || segment
          breadcrumbs.push({
            name: `${parentName} Details`,
            href: currentPath,
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
