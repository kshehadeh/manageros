'use client'

import { useState } from 'react'
import { JobRolesTable } from './job-roles-table'
import { JobManagementSidebar } from './job-management-sidebar'
import type { JobLevel, JobDomain, JobRole } from '@/types/job-roles'

interface JobRolesPageClientProps {
  jobRoles: JobRole[]
  levels: JobLevel[]
  domains: JobDomain[]
}

export function JobRolesPageClient({
  jobRoles: initialJobRoles,
  levels,
  domains,
}: JobRolesPageClientProps) {
  const [jobRoles] = useState(initialJobRoles)

  const handleRefresh = async () => {
    // Reload the page to get fresh data
    window.location.reload()
  }

  return (
    <div className='flex gap-6'>
      {/* Main Content - Job Roles Table */}
      <div className='flex-1'>
        <JobRolesTable
          jobRoles={jobRoles}
          levels={levels}
          domains={domains}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Right Sidebar - Levels and Domains */}
      <JobManagementSidebar levels={levels} domains={domains} />
    </div>
  )
}
