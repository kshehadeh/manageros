'use client'

import { ManageOwnersModal } from './manage-owners-modal'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ManagePeopleHeaderActionProps {
  initiativeId: string
  className?: string
}

/**
 * A button-styled action component for managing people in initiative section headers.
 * Matches the styling of SectionHeaderAction but opens a modal instead of navigating.
 */
export function ManagePeopleHeaderAction({
  initiativeId,
  className,
}: ManagePeopleHeaderActionProps) {
  const baseStyles = cn(
    'inline-flex items-center gap-1 text-sm text-muted-foreground',
    'hover:text-foreground transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'bg-transparent border-none p-0 cursor-pointer',
    className
  )

  return (
    <ManageOwnersModal
      initiativeId={initiativeId}
      trigger={
        <button className={baseStyles} title='Manage People'>
          <Users className='w-3.5 h-3.5' />
          Manage
        </button>
      }
    />
  )
}
