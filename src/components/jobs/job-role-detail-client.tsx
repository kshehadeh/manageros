'use client'

import { useEffect } from 'react'
import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface JobRoleDetailClientProps {
  jobRoleTitle: string
  jobRoleId: string
  children: React.ReactNode
}

export function JobRoleDetailClient({
  jobRoleTitle,
  jobRoleId,
  children,
}: JobRoleDetailClientProps) {
  usePageBreadcrumbs([
    { name: 'Job Roles', href: '/organization/job-roles' },
    { name: jobRoleTitle, href: `/job-roles/${jobRoleId}` },
  ])

  useEffect(() => {
    // Set page title for browser tab
    document.title = `${jobRoleTitle} - Job Role - ManagerOS`
  }, [jobRoleTitle])

  return <>{children}</>
}
