'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface ActivityBreadcrumbClientProps {
  personName: string
  personId: string
  children: React.ReactNode
}

export function ActivityBreadcrumbClient({
  personName,
  personId,
  children,
}: ActivityBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'People', href: '/people' },
    { name: personName, href: `/people/${personId}` },
    {
      name: 'Activity',
      href: `/people/${personId}/activity`,
    },
  ])

  return <>{children}</>
}
