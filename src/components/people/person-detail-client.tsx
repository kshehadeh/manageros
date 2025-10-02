'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface PersonDetailClientProps {
  personName: string
  personId: string
  children: React.ReactNode
}

export function PersonDetailClient({
  personName,
  personId,
  children,
}: PersonDetailClientProps) {
  usePageBreadcrumbs([
    { name: 'People', href: '/people' },
    { name: personName, href: `/people/${personId}` },
  ])

  return <>{children}</>
}
