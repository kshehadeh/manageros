'use client'

import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { ChevronDown, Eye, Grid3X3, LayoutDashboard, List } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function InitiativesViewDropdown() {
  const pathname = usePathname()

  const isDashboard = pathname === '/initiatives'
  const isList = pathname === '/initiatives/list'
  const isSlots = pathname === '/initiatives/slots'

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
            href='/initiatives'
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
              isDashboard && 'bg-accent'
            )}
            onClick={close}
          >
            <LayoutDashboard className='w-4 h-4' />
            Dashboard
          </Link>
          <Link
            href='/initiatives/list'
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
              isList && 'bg-accent'
            )}
            onClick={close}
          >
            <List className='w-4 h-4' />
            List
          </Link>
          <Link
            href='/initiatives/slots'
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
              isSlots && 'bg-accent'
            )}
            onClick={close}
          >
            <Grid3X3 className='w-4 h-4' />
            Slots
          </Link>
        </div>
      )}
    </ActionDropdown>
  )
}
