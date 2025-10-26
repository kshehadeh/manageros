'use client'

import { useEffect, useRef } from 'react'
import {
  useBreadcrumb,
  type BreadcrumbItem,
} from '@/components/breadcrumb-provider'

// Re-export BreadcrumbItem type for convenience
export type { BreadcrumbItem }

/**
 * Hook to set breadcrumbs for a page
 * @param breadcrumbs - Array of breadcrumb items
 */
export function useSetBreadcrumbs(breadcrumbs: BreadcrumbItem[]) {
  const { setBreadcrumbs, setHasManualBreadcrumbs } = useBreadcrumb()
  const prevBreadcrumbsRef = useRef<string>('')

  useEffect(() => {
    const breadcrumbsString = JSON.stringify(breadcrumbs)
    if (breadcrumbsString !== prevBreadcrumbsRef.current) {
      setBreadcrumbs(breadcrumbs)
      setHasManualBreadcrumbs(true)
      prevBreadcrumbsRef.current = breadcrumbsString
    }
  }, [setBreadcrumbs, breadcrumbs, setHasManualBreadcrumbs])
}

/**
 * Hook to set breadcrumbs with a default Dashboard breadcrumb
 * @param additionalBreadcrumbs - Additional breadcrumb items (Dashboard will be prepended)
 */
export function usePageBreadcrumbs(additionalBreadcrumbs: BreadcrumbItem[]) {
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Dashboard', href: '/dashboard' },
    ...additionalBreadcrumbs,
  ]

  useSetBreadcrumbs(breadcrumbs)
}
