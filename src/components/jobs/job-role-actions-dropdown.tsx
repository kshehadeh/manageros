'use client'

import Link from 'next/link'
import { Edit, Trash2 } from 'lucide-react'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { deleteJobRole } from '@/lib/actions'

interface JobRoleActionsDropdownProps {
  jobRoleId: string
  jobRoleTitle: string
  size?: 'sm' | 'default'
}

export function JobRoleActionsDropdown({
  jobRoleId,
  jobRoleTitle,
  size = 'default',
}: JobRoleActionsDropdownProps) {
  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete the job role "${jobRoleTitle}"? This action cannot be undone.`,
      )
    ) {
      return
    }

    try {
      await deleteJobRole(jobRoleId)
      window.location.href = '/organization/job-roles'
    } catch (error) {
      console.error('Error deleting job role:', error)
    }
  }

  return (
    <ActionDropdown size={size}>
      {({ close }) => (
        <div className='py-1'>
          <Link
            href={`/job-roles/${jobRoleId}/edit`}
            className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
            onClick={close}
          >
            <Edit className='h-4 w-4' />
            Edit Job Role
          </Link>
          <button
            onClick={handleDelete}
            className='flex w-full items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-accent hover:text-destructive transition-colors'
          >
            <Trash2 className='h-4 w-4' />
            Delete Job Role
          </button>
        </div>
      )}
    </ActionDropdown>
  )
}
