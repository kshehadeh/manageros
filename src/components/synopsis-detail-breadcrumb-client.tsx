'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface SynopsisDetailBreadcrumbClientProps {
  personName: string
  personId: string
  synopsisId: string
  children: React.ReactNode
}

export function SynopsisDetailBreadcrumbClient({
  personName,
  personId,
  synopsisId,
  children,
}: SynopsisDetailBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'People', href: '/people' },
    { name: personName, href: `/people/${personId}` },
    { name: 'Synopses', href: `/people/${personId}/synopses` },
    {
      name: 'Synopsis Details',
      href: `/people/${personId}/synopses/${synopsisId}`,
    },
  ])

  return <>{children}</>
}
