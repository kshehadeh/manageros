'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface OrganizationSettingsBreadcrumbClientProps {
  children: React.ReactNode
}

export function OrganizationSettingsBreadcrumbClient({
  children,
}: OrganizationSettingsBreadcrumbClientProps) {
  usePageBreadcrumbs([{ name: 'Manage Users', href: '/organization/settings' }])

  return <>{children}</>
}
