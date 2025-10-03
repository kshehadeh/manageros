'use client'

import { JobLevelManagement } from './job-level-management'
import { JobDomainManagement } from './job-domain-management'
import type { JobLevel, JobDomain } from '@/types/job-roles'

interface JobManagementSidebarProps {
  levels: JobLevel[]
  domains: JobDomain[]
}

export function JobManagementSidebar({
  levels,
  domains,
}: JobManagementSidebarProps) {
  return (
    <div className='w-80 space-y-6'>
      {/* Job Levels */}
      <div>
        <JobLevelManagement levels={levels} />
      </div>

      {/* Job Domains */}
      <div>
        <JobDomainManagement domains={domains} />
      </div>
    </div>
  )
}
