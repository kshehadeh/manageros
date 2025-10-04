'use client'

import { useEffect, useRef } from 'react'
import { useBreadcrumb } from '@/components/breadcrumb-provider'

interface BreadcrumbItem {
  name: string
  href: string
}

/**
 * Hook to set breadcrumbs for a page
 * @param breadcrumbs - Array of breadcrumb items
 */
export function useSetBreadcrumbs(breadcrumbs: BreadcrumbItem[]) {
  const { setBreadcrumbs } = useBreadcrumb()
  const prevBreadcrumbsRef = useRef<string>('')

  useEffect(() => {
    const breadcrumbsString = JSON.stringify(breadcrumbs)
    if (breadcrumbsString !== prevBreadcrumbsRef.current) {
      setBreadcrumbs(breadcrumbs)
      prevBreadcrumbsRef.current = breadcrumbsString
    }
  }, [setBreadcrumbs, breadcrumbs])
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
