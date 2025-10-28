'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface NewMeetingInstanceBreadcrumbClientProps {
  meetingTitle: string
  meetingId: string
  children: React.ReactNode
}

export function NewMeetingInstanceBreadcrumbClient({
  meetingTitle,
  meetingId,
  children,
}: NewMeetingInstanceBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'Meetings', href: '/meetings' },
    { name: meetingTitle, href: `/meetings/${meetingId}` },
    { name: 'New Instance', href: `/meetings/${meetingId}/instances/new` },
  ])

  return <>{children}</>
}
