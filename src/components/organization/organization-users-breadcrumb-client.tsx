'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface OrganizationUsersBreadcrumbClientProps {
  children: React.ReactNode
}

export function OrganizationUsersBreadcrumbClient({
  children,
}: OrganizationUsersBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'Organization Settings', href: '/organization/settings' },
    { name: 'Manage Users', href: '/organization/users' },
  ])

  return <>{children}</>
}
