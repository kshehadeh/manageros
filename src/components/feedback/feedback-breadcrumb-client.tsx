'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface FeedbackBreadcrumbClientProps {
  personName: string
  personId: string
  children: React.ReactNode
}

export function FeedbackBreadcrumbClient({
  personName,
  personId,
  children,
}: FeedbackBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'People', href: '/people' },
    { name: personName, href: `/people/${personId}` },
    { name: 'Feedback', href: `/people/${personId}/feedback` },
  ])

  return <>{children}</>
}
