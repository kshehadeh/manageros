'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface OverviewBreadcrumbClientProps {
  personName: string
  personId: string
  children: React.ReactNode
}

export function OverviewBreadcrumbClient({
  personName,
  personId,
  children,
}: OverviewBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'People', href: '/people' },
    { name: personName, href: `/people/${personId}` },
    {
      name: 'AI Overview',
      href: `/people/${personId}/overview`,
    },
  ])

  return <>{children}</>
}
