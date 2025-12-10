'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { Plus, ChevronDown, Pickaxe, Layers, Folder } from 'lucide-react'
import { JobRoleDialog } from './job-role-dialog'
import { JobLevelDialog } from './job-level-dialog'
import { JobDomainDialog } from './job-domain-dialog'
import type { JobLevel, JobDomain } from '@/types/job-roles'

interface JobRolesListActionsDropdownProps {
  canCreateJobRole: boolean
  levels: JobLevel[]
  domains: JobDomain[]
}

export function JobRolesListActionsDropdown({
  canCreateJobRole,
  levels,
  domains,
}: JobRolesListActionsDropdownProps) {
  const router = useRouter()
  const [isJobRoleDialogOpen, setIsJobRoleDialogOpen] = useState(false)
  const [isLevelDialogOpen, setIsLevelDialogOpen] = useState(false)
  const [isDomainDialogOpen, setIsDomainDialogOpen] = useState(false)

  const handleJobRoleSuccess = () => {
    setIsJobRoleDialogOpen(false)
    router.refresh()
  }

  const handleLevelSuccess = () => {
    setIsLevelDialogOpen(false)
    router.refresh()
  }

  const handleDomainSuccess = () => {
    setIsDomainDialogOpen(false)
    router.refresh()
  }

  // Only show dropdown if user can create at least one thing
  if (!canCreateJobRole) {
    return null
  }

  return (
    <>
      <ActionDropdown
        trigger={({ toggle }) => (
          <Button
            variant='outline'
            size='sm'
            className='flex items-center gap-2'
            onClick={toggle}
          >
            <Pickaxe className='w-4 h-4' />
            <span className='hidden sm:inline'>Actions</span>
            <ChevronDown className='w-4 h-4' />
          </Button>
        )}
      >
        {({ close }) => (
          <div className='py-1'>
            {canCreateJobRole && (
              <button
                type='button'
                onClick={() => {
                  setIsJobRoleDialogOpen(true)
                  close()
                }}
                disabled={levels.length === 0 || domains.length === 0}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <Plus className='w-4 h-4' />
                Add Job Role
              </button>
            )}
            <button
              type='button'
              onClick={() => {
                setIsLevelDialogOpen(true)
                close()
              }}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left'
            >
              <Layers className='w-4 h-4' />
              Add Level
            </button>
            <button
              type='button'
              onClick={() => {
                setIsDomainDialogOpen(true)
                close()
              }}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left'
            >
              <Folder className='w-4 h-4' />
              Add Domain
            </button>
          </div>
        )}
      </ActionDropdown>

      <JobRoleDialog
        open={isJobRoleDialogOpen}
        onOpenChange={setIsJobRoleDialogOpen}
        jobRoleId={null}
        initialData={undefined}
        levels={levels}
        domains={domains}
        onSuccess={handleJobRoleSuccess}
      />

      <JobLevelDialog
        open={isLevelDialogOpen}
        onOpenChange={setIsLevelDialogOpen}
        levelId={null}
        initialData={undefined}
        onSuccess={handleLevelSuccess}
      />

      <JobDomainDialog
        open={isDomainDialogOpen}
        onOpenChange={setIsDomainDialogOpen}
        domainId={null}
        initialData={undefined}
        onSuccess={handleDomainSuccess}
      />
    </>
  )
}
