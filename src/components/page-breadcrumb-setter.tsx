'use client'

import { useLayoutEffect } from 'react'
import { useBreadcrumb } from './breadcrumb-provider'
import type { BreadcrumbItem } from './breadcrumb-provider'

interface PageBreadcrumbSetterProps {
  breadcrumbs: BreadcrumbItem[]
  children: React.ReactNode
}

/**
 * Client component that sets breadcrumbs synchronously (before paint)
 * This eliminates race conditions by setting breadcrumbs immediately
 * rather than in useEffect (which runs after paint)
 *
 * Breadcrumbs are passed as props from the server component, ensuring
 * they're available immediately when the component mounts.
 *
 * @see docs/breadcrumbs.md for complete documentation on the breadcrumb system
 */
export function PageBreadcrumbSetter({
  breadcrumbs,
  children,
}: PageBreadcrumbSetterProps) {
  const { setBreadcrumbs } = useBreadcrumb()

  // Use useLayoutEffect to set breadcrumbs synchronously before paint
  // This prevents the "Loading..." flash that occurs with useEffect
  useLayoutEffect(() => {
    setBreadcrumbs(breadcrumbs)
  }, [breadcrumbs, setBreadcrumbs])

  return <>{children}</>
}
