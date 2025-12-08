'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface NewNoteBreadcrumbClientProps {
  children: React.ReactNode
}

export function NewNoteBreadcrumbClient({
  children,
}: NewNoteBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'Notes', href: '/notes' },
    { name: 'New Note', href: '/notes/new' },
  ])

  return <>{children}</>
}
