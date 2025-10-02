'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface TeamDetailClientProps {
  teamName: string
  teamId: string
  children: React.ReactNode
}

export function TeamDetailClient({
  teamName,
  teamId,
  children,
}: TeamDetailClientProps) {
  usePageBreadcrumbs([
    { name: 'Teams', href: '/teams' },
    { name: teamName, href: `/teams/${teamId}` },
  ])

  return <>{children}</>
}
