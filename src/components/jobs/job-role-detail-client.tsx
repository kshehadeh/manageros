'use client'

import { useEffect } from 'react'

interface JobRoleDetailClientProps {
  jobRoleTitle: string
  jobRoleId: string
  children: React.ReactNode
}

export function JobRoleDetailClient({
  jobRoleTitle,
  jobRoleId: _jobRoleId,
  children,
}: JobRoleDetailClientProps) {
  useEffect(() => {
    // Set page title for browser tab
    document.title = `${jobRoleTitle} - Job Role - ManagerOS`
  }, [jobRoleTitle])

  return <>{children}</>
}
