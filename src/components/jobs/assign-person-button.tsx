'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import { JobRoleAssignModal } from './job-role-assign-modal'
import { useRouter } from 'next/navigation'

interface AssignPersonButtonProps {
  jobRoleId: string
  excludePersonIds?: string[]
}

export function AssignPersonButton({
  jobRoleId,
  excludePersonIds = [],
}: AssignPersonButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const handleSuccess = () => {
    // Refresh the page to show the updated people list
    router.refresh()
  }

  return (
    <>
      <Button variant='outline' size='sm' onClick={() => setIsModalOpen(true)}>
        <UserPlus className='h-4 w-4 mr-2' />
        Add Person
      </Button>
      <JobRoleAssignModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        jobRoleId={jobRoleId}
        onSuccess={handleSuccess}
        excludePersonIds={excludePersonIds}
      />
    </>
  )
}
