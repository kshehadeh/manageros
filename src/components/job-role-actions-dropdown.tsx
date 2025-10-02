'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
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
        `Are you sure you want to delete the job role "${jobRoleTitle}"? This action cannot be undone.`
      )
    ) {
      return
    }

    try {
      await deleteJobRole(jobRoleId)
      // Redirect to job roles management page after deletion
      window.location.href = '/organization/job-roles'
    } catch (error) {
      console.error('Error deleting job role:', error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size={size}
          className={`${size === 'sm' ? 'h-8 w-8 p-0' : 'h-8 w-8 p-0'}`}
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {/* Edit Job Role */}
        <DropdownMenuItem asChild>
          <Link href={`/job-roles/${jobRoleId}/edit`}>
            <Edit className='h-4 w-4 mr-2' />
            Edit Job Role
          </Link>
        </DropdownMenuItem>

        {/* Delete Job Role */}
        <DropdownMenuItem
          onClick={handleDelete}
          className='text-red-600 focus:text-red-600'
        >
          <Trash2 className='h-4 w-4 mr-2' />
          Delete Job Role
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
