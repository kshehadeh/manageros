'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface OneOnOneDetailClientProps {
  managerName: string
  reportName: string
  oneOnOneId: string
  children: React.ReactNode
}

export function OneOnOneDetailClient({
  managerName,
  reportName,
  oneOnOneId,
  children,
}: OneOnOneDetailClientProps) {
  const meetingTitle = `${managerName} ↔ ${reportName}`

  usePageBreadcrumbs(
    [
      { name: '1:1s', href: '/oneonones' },
      { name: meetingTitle, href: `/oneonones/${oneOnOneId}` },
    ],
    [managerName, reportName, oneOnOneId]
  )

  return <>{children}</>
}
