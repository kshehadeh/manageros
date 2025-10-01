'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface NewFeedbackBreadcrumbClientProps {
  personName: string
  personId: string
  children: React.ReactNode
}

export function NewFeedbackBreadcrumbClient({
  personName,
  personId,
  children,
}: NewFeedbackBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'People', href: '/people' },
    { name: personName, href: `/people/${personId}` },
    { name: 'New Feedback', href: `/people/${personId}/feedback/new` },
  ])

  return <>{children}</>
}
