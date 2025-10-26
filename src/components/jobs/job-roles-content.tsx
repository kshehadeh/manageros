'use client'

import { JobRolesDataTable } from './job-roles-data-table'
import { JobManagementSidebar } from './job-management-sidebar'
import type { JobLevel, JobDomain } from '@/types/job-roles'

interface JobRolesContentProps {
  levels: JobLevel[]
  domains: JobDomain[]
}

export function JobRolesContent({ levels, domains }: JobRolesContentProps) {
  return (
    <div className='flex gap-6'>
      {/* Main Content - Job Roles Table */}
      <div className='flex-1'>
        <JobRolesDataTable
          settingsId='job-roles-management'
          limit={50}
          enablePagination={false}
        />
      </div>

      {/* Right Sidebar - Levels and Domains */}
      <JobManagementSidebar levels={levels} domains={domains} />
    </div>
  )
}
