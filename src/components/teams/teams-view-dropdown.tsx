'use client'

import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { Workflow, ChevronDown, Eye, List } from 'lucide-react'
import { useUserSettings } from '@/lib/hooks/use-user-settings'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function TeamsViewDropdown() {
  const pathname = usePathname()
  const { updateSetting } = useUserSettings()

  const isList = pathname === '/teams/list'
  const isChart = pathname === '/teams/chart'

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
            href='/teams/list'
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
              isList && 'bg-accent'
            )}
            onClick={() => {
              updateSetting('teamsDefaultView', 'list')
              close()
            }}
          >
            <List className='w-4 h-4' />
            List
          </Link>
          <Link
            href='/teams/chart'
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
              isChart && 'bg-accent'
            )}
            onClick={() => {
              updateSetting('teamsDefaultView', 'chart')
              close()
            }}
          >
            <Workflow className='w-4 h-4' />
            Organizational Chart
          </Link>
        </div>
      )}
    </ActionDropdown>
  )
}
