'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface TeamEditClientProps {
  teamName: string
  teamId: string
  children: React.ReactNode
}

export function TeamEditClient({
  teamName,
  teamId,
  children,
}: TeamEditClientProps) {
  usePageBreadcrumbs([
    { name: 'Teams', href: '/teams' },
    { name: teamName, href: `/teams/${teamId}` },
    { name: 'Edit', href: `/teams/${teamId}/edit` },
  ])

  return <>{children}</>
}
