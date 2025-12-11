'use client'

import { JobLevelManagement } from './job-level-management'
import { JobDomainManagement } from './job-domain-management'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Layers, Briefcase } from 'lucide-react'
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
      <PageSection header={<SectionHeader icon={Layers} title='Job Levels' />}>
        <JobLevelManagement levels={levels} />
      </PageSection>

      {/* Job Domains */}
      <PageSection
        header={<SectionHeader icon={Briefcase} title='Job Domains' />}
      >
        <JobDomainManagement domains={domains} />
      </PageSection>
    </div>
  )
}
