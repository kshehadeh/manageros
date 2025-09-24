'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface MeetingDetailBreadcrumbClientProps {
  meetingTitle: string
  meetingId: string
  children: React.ReactNode
}

export function MeetingDetailBreadcrumbClient({
  meetingTitle,
  meetingId,
  children,
}: MeetingDetailBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'Meetings', href: '/meetings' },
    { name: meetingTitle, href: `/meetings/${meetingId}` },
  ])

  return <>{children}</>
}
