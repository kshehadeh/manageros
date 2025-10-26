'use client'

import { useEffect, useRef } from 'react'
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
  '/feedback-campaigns': 'Feedback Campaigns',
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
  const { setBreadcrumbs, hasManualBreadcrumbs, setHasManualBreadcrumbs } =
    useBreadcrumb()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const prevPathnameRef = useRef<string>('')

  useEffect(() => {
    // Reset manual breadcrumbs flag when pathname changes
    if (pathname !== prevPathnameRef.current) {
      setHasManualBreadcrumbs(false)
      prevPathnameRef.current = pathname
    }
  }, [pathname, setHasManualBreadcrumbs])

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
          let name = routeMap[currentPath]
          if (!name) {
            // Handle kebab-case by capitalizing each word
            name = segment
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
          }
          breadcrumbs.push({
            name,
            href: currentPath,
          })
        }
      })

      return breadcrumbs
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Add a small delay to allow manual breadcrumb handlers to set breadcrumbs first
    // This prevents the default handler from overwriting manually set breadcrumbs
    timeoutRef.current = setTimeout(() => {
      // Only set breadcrumbs if manual breadcrumbs haven't been set
      if (!hasManualBreadcrumbs) {
        setBreadcrumbs(generateBreadcrumbs())
      }
    }, 100)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [pathname, setBreadcrumbs, hasManualBreadcrumbs])

  return null
}
