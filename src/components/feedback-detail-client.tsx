'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface FeedbackDetailClientProps {
  feedbackKind: string
  fromName: string
  aboutName: string
  feedbackId: string
  children: React.ReactNode
}

export function FeedbackDetailClient({
  feedbackKind,
  fromName,
  aboutName,
  feedbackId,
  children,
}: FeedbackDetailClientProps) {
  const feedbackTitle = `${fromName} → ${aboutName} (${feedbackKind})`

  usePageBreadcrumbs(
    [
      { name: 'Feedback', href: '/feedback' },
      { name: feedbackTitle, href: `/feedback/${feedbackId}` },
    ],
    [feedbackKind, fromName, aboutName, feedbackId]
  )

  return <>{children}</>
}
