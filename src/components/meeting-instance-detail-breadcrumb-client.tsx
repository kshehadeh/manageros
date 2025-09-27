'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface MeetingInstanceDetailBreadcrumbClientProps {
  meetingTitle: string
  meetingId: string
  instanceId: string
  children: React.ReactNode
}

export function MeetingInstanceDetailBreadcrumbClient({
  meetingTitle,
  meetingId,
  instanceId,
  children,
}: MeetingInstanceDetailBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'Meetings', href: '/meetings' },
    { name: meetingTitle, href: `/meetings/${meetingId}` },
    {
      name: 'Instance',
      href: `/meetings/${meetingId}/instances/${instanceId}`,
    },
  ])

  return <>{children}</>
}
