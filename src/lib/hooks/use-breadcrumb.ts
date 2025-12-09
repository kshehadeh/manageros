'use client'

import { useLayoutEffect, useRef, useMemo } from 'react'
import {
  useBreadcrumb,
  type BreadcrumbItem,
} from '@/components/breadcrumb-provider'

// Re-export BreadcrumbItem type for convenience
export type { BreadcrumbItem }

/**
 * Hook to set breadcrumbs for a page
 * Uses useLayoutEffect to set synchronously before paint, preventing race conditions
 * @param breadcrumbs - Array of breadcrumb items
 */
export function useSetBreadcrumbs(breadcrumbs: BreadcrumbItem[]) {
  const { setBreadcrumbs } = useBreadcrumb()
  const prevBreadcrumbsRef = useRef<string>('')

  // Create a stable string representation for comparison
  const breadcrumbsString = JSON.stringify(breadcrumbs)

  // Use useLayoutEffect instead of useEffect to set synchronously before paint
  // This prevents the "Loading..." flash that occurs with useEffect
  useLayoutEffect(() => {
    // Always update breadcrumbs when they change
    if (breadcrumbsString !== prevBreadcrumbsRef.current) {
      setBreadcrumbs(breadcrumbs)
      prevBreadcrumbsRef.current = breadcrumbsString
    }
  }, [breadcrumbs, breadcrumbsString, setBreadcrumbs])
}

/**
 * Hook to set breadcrumbs with a default Dashboard breadcrumb
 * @param additionalBreadcrumbs - Additional breadcrumb items (Dashboard will be prepended)
 */
export function usePageBreadcrumbs(additionalBreadcrumbs: BreadcrumbItem[]) {
  // Memoize the breadcrumbs array to prevent unnecessary effect reruns
  // Use JSON.stringify as the dependency since the array contents are what matter
  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [{ name: 'Dashboard', href: '/dashboard' }, ...additionalBreadcrumbs],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(additionalBreadcrumbs)]
  )

  useSetBreadcrumbs(breadcrumbs)
}
