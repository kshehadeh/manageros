'use client'

import { useEffect } from 'react'
import { useBreadcrumb } from '@/components/breadcrumb-provider'

interface BreadcrumbItem {
  name: string
  href: string
}

/**
 * Hook to set breadcrumbs for a page
 * @param breadcrumbs - Array of breadcrumb items
 * @param deps - Dependencies array for useEffect
 */
export function useSetBreadcrumbs(breadcrumbs: BreadcrumbItem[]) {
  const { setBreadcrumbs } = useBreadcrumb()

  useEffect(() => {
    setBreadcrumbs(breadcrumbs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/**
 * Hook to set breadcrumbs with a default Dashboard breadcrumb
 * @param additionalBreadcrumbs - Additional breadcrumb items (Dashboard will be prepended)
 * @param deps - Dependencies array for useEffect
 */
export function usePageBreadcrumbs(additionalBreadcrumbs: BreadcrumbItem[]) {
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Dashboard', href: '/dashboard' },
    ...additionalBreadcrumbs,
  ]

  useSetBreadcrumbs(breadcrumbs)
}
