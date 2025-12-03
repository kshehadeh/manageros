'use client'

import { useRouter } from 'next/navigation'
import { Link } from '@/components/ui/link'
import { Edit, Trash2 } from 'lucide-react'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { ConfirmAction } from '@/components/common/confirm-action'
import { deleteJobRole } from '@/lib/actions/job-roles'
import { toast } from 'sonner'

interface JobRoleActionsDropdownProps {
  jobRoleId: string
  jobRoleTitle: string
  size?: 'sm' | 'default'
}

export function JobRoleActionsDropdown({
  jobRoleId,
  jobRoleTitle,
  size = 'sm',
}: JobRoleActionsDropdownProps) {
  const router = useRouter()
  const handleDelete = async () => {
    try {
      await deleteJobRole(jobRoleId)
      toast.success('Job role deleted successfully')
      router.push('/organization/job-roles')
    } catch (error) {
      console.error('Error deleting job role:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete job role'
      )
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
          <div className='border-t border-border my-1' />

          <ConfirmAction
            onConfirm={handleDelete}
            renderTrigger={({ open }) => (
              <button
                className='flex w-full items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors text-left'
                onClick={open}
              >
                <Trash2 className='h-4 w-4' />
                Delete Job Role
              </button>
            )}
            confirmMessage={`Are you sure you want to delete "${jobRoleTitle}"?`}
            confirmDescription='This action cannot be undone.'
          />
        </div>
      )}
    </ActionDropdown>
  )
}
