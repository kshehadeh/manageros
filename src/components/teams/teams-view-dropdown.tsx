'use client'

import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { Workflow, ChevronDown, Eye } from 'lucide-react'

export function TeamsViewDropdown() {
  return (
    <ActionDropdown
      trigger={({ toggle }) => (
        <Button
          variant='outline'
          size='sm'
          className='flex items-center gap-2'
          onClick={toggle}
        >
          <Eye className='w-4 h-4' />
          <span className='hidden sm:inline'>View</span>
          <ChevronDown className='w-4 h-4' />
        </Button>
      )}
    >
      {({ close }) => (
        <div className='py-1'>
          <Link
            href='/teams/chart'
            className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
            onClick={close}
          >
            <Workflow className='w-4 h-4' />
            Organizational Chart
          </Link>
        </div>
      )}
    </ActionDropdown>
  )
}
