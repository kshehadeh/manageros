'use client'

import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { Upload, UserPlus, ChevronDown, Pickaxe } from 'lucide-react'

interface PeopleActionsDropdownProps {
  canCreatePeople: boolean
  canImportPeople: boolean
}

export function PeopleActionsDropdown({
  canCreatePeople,
  canImportPeople,
}: PeopleActionsDropdownProps) {
  if (!canCreatePeople && !canImportPeople) {
    return null
  }

  return (
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
          {canCreatePeople && (
            <Link
              href='/people/new'
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={close}
            >
              <UserPlus className='w-4 h-4' />
              Create Person
            </Link>
          )}
          {canImportPeople && (
            <Link
              href='/people/import'
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={close}
            >
              <Upload className='w-4 h-4' />
              Import CSV
            </Link>
          )}
        </div>
      )}
    </ActionDropdown>
  )
}
