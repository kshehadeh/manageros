'use client'

import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { ActionDropdown } from '@/components/common/action-dropdown'
import {
  Activity,
  Sparkles,
  Eye,
  ChevronDown,
  MessageSquare,
} from 'lucide-react'

interface PersonViewDropdownProps {
  personId: string
}

export function PersonViewDropdown({ personId }: PersonViewDropdownProps) {
  return (
    <ActionDropdown
      size='sm'
      trigger={({ toggle }) => (
        <Button
          variant='ghost'
          size='sm'
          className='flex items-center gap-md'
          onClick={toggle}
        >
          <Eye className='h-4 w-4' />
          <span className='hidden md:block'>View</span>
          <ChevronDown className='h-4 w-4' />
        </Button>
      )}
    >
      {({ close }) => (
        <div className='py-1'>
          <Link
            href={`/people/${personId}/overview`}
            className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
            onClick={close}
          >
            <Sparkles className='w-4 h-4' />
            AI Overview
          </Link>
          <Link
            href={`/people/${personId}/activity`}
            className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
            onClick={close}
          >
            <Activity className='w-4 h-4' />
            Activity
          </Link>
          <Link
            href={`/people/${personId}/feedback-campaigns`}
            className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
            onClick={close}
          >
            <MessageSquare className='w-4 h-4' />
            Feedback 360
          </Link>
        </div>
      )}
    </ActionDropdown>
  )
}
