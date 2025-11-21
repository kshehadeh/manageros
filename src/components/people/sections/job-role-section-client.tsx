'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import { Briefcase, Edit } from 'lucide-react'
import { JobRoleEditModal } from './job-role-edit-modal'

interface JobRole {
  id: string
  title: string
  level: { id: string; name: string }
  domain: { id: string; name: string }
}

interface JobRoleSectionClientProps {
  personId: string
  personName: string
  currentJobRole: JobRole | null
  availableJobRoles: JobRole[]
}

export function JobRoleSectionClient({
  personId,
  personName,
  currentJobRole,
  availableJobRoles,
}: JobRoleSectionClientProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleSuccess = () => {
    // Refresh the page data to show the updated job role
    router.refresh()
    handleModalClose()
  }

  return (
    <>
      <SectionHeader
        icon={Briefcase}
        title='Job Role'
        action={
          <Button
            variant='outline'
            size='sm'
            onClick={() => setIsModalOpen(true)}
            title='Edit Job Role'
          >
            <Edit className='w-4 h-4' />
          </Button>
        }
      />

      {currentJobRole ? (
        <div className='space-y-2'>
          <div className='p-2'>
            <div className='text-sm font-medium'>{currentJobRole.title}</div>
            <div className='text-xs text-muted-foreground mt-1'>
              {currentJobRole.level?.name} • {currentJobRole.domain?.name}
            </div>
          </div>
        </div>
      ) : (
        <div className='text-sm text-muted-foreground'>
          No job role assigned.
        </div>
      )}

      <JobRoleEditModal
        personId={personId}
        personName={personName}
        currentJobRole={currentJobRole}
        availableJobRoles={availableJobRoles}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
    </>
  )
}
