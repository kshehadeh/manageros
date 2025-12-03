'use client'

import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { Upload, Plus, ChevronDown, Pickaxe } from 'lucide-react'

interface TeamsActionsDropdownProps {
  canCreateTeam: boolean
  canImportTeam: boolean
}

export function TeamsActionsDropdown({
  canCreateTeam,
  canImportTeam,
}: TeamsActionsDropdownProps) {
  if (!canCreateTeam && !canImportTeam) {
    return null
  }

  return (
    <ActionDropdown
      trigger={({ toggle }) => (
        <Button
          variant='outline'
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
          {canCreateTeam && (
            <Link
              href='/teams/new'
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={close}
            >
              <Plus className='w-4 h-4' />
              Create Team
            </Link>
          )}
          {canImportTeam && (
            <Link
              href='/teams/import'
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={close}
            >
              <Upload className='w-4 h-4' />
              Import Teams
            </Link>
          )}
        </div>
      )}
    </ActionDropdown>
  )
}
