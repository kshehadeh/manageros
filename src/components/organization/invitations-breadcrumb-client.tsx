'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface InvitationsBreadcrumbClientProps {
  children: React.ReactNode
}

export function InvitationsBreadcrumbClient({
  children,
}: InvitationsBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'Manage Users', href: '/organization/settings' },
    { name: 'Invitations', href: '/organization/invitations' },
  ])

  return <>{children}</>
}
