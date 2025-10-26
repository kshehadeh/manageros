'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface JobRolesBreadcrumbClientProps {
  children: React.ReactNode
}

export function JobRolesBreadcrumbClient({
  children,
}: JobRolesBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'Organization Settings', href: '/organization/settings' },
    { name: 'Job Roles', href: '/organization/job-roles' },
  ])

  return <>{children}</>
}
