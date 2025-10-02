'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface InitiativeDetailClientProps {
  initiativeTitle: string
  initiativeId: string
  children: React.ReactNode
}

export function InitiativeDetailClient({
  initiativeTitle,
  initiativeId,
  children,
}: InitiativeDetailClientProps) {
  usePageBreadcrumbs([
    { name: 'Initiatives', href: '/initiatives' },
    { name: initiativeTitle, href: `/initiatives/${initiativeId}` },
  ])

  return <>{children}</>
}
