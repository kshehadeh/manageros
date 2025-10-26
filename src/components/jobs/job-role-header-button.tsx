'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JobRoleDialog } from './job-role-dialog'
import type { JobLevel, JobDomain } from '@/types/job-roles'

interface JobRoleHeaderButtonProps {
  levels: JobLevel[]
  domains: JobDomain[]
}

export function JobRoleHeaderButton({
  levels,
  domains,
}: JobRoleHeaderButtonProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleAdd = () => {
    setIsDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    setIsDialogOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button
        onClick={handleAdd}
        disabled={levels.length === 0 || domains.length === 0}
      >
        <Plus className='mr-2 h-4 w-4' />
        Add Job Role
      </Button>

      <JobRoleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        jobRoleId={null}
        initialData={undefined}
        levels={levels}
        domains={domains}
        onSuccess={handleDialogSuccess}
      />
    </>
  )
}
