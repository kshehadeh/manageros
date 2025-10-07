'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface EditFeedbackBreadcrumbClientProps {
  personName: string
  personId: string
  feedbackId: string
  children: React.ReactNode
}

export function EditFeedbackBreadcrumbClient({
  personName,
  personId,
  feedbackId,
  children,
}: EditFeedbackBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'People', href: '/people' },
    { name: personName, href: `/people/${personId}` },
    {
      name: 'Feedback',
      href: `/people/${personId}/feedback`,
    },
    {
      name: 'Edit Feedback',
      href: `/people/${personId}/feedback/${feedbackId}/edit`,
    },
  ])

  return <>{children}</>
}
