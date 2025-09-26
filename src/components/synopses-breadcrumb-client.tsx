'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface SynopsesBreadcrumbClientProps {
  personName: string
  personId: string
  children: React.ReactNode
}

export function SynopsesBreadcrumbClient({
  personName,
  personId,
  children,
}: SynopsesBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'People', href: '/people' },
    { name: personName, href: `/people/${personId}` },
    {
      name: 'Synopses',
      href: `/people/${personId}/synopses`,
    },
  ])

  return <>{children}</>
}
