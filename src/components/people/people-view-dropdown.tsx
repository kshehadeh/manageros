'use client'

import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { ActionDropdown } from '@/components/common/action-dropdown'
import {
  Workflow,
  ChevronDown,
  Eye,
  LayoutDashboard,
  List,
  UserCheck,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUserSettings } from '@/lib/hooks/use-user-settings'

export function PeopleViewDropdown() {
  const pathname = usePathname()
  const { updateSetting } = useUserSettings()

  const isDashboard = pathname === '/people'
  const isList = pathname === '/people/list'
  const isChart = pathname === '/people/chart'
  const isDirectReports = pathname === '/people/direct-reports'

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
            href='/people'
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
              isDashboard && 'bg-accent'
            )}
            onClick={() => {
              updateSetting('peopleDefaultView', 'dashboard')
              close()
            }}
          >
            <LayoutDashboard className='w-4 h-4' />
            Dashboard
          </Link>
          <Link
            href='/people/list'
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
              isList && 'bg-accent'
            )}
            onClick={() => {
              updateSetting('peopleDefaultView', 'list')
              close()
            }}
          >
            <List className='w-4 h-4' />
            List
          </Link>
          <Link
            href='/people/direct-reports'
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
              isDirectReports && 'bg-accent'
            )}
            onClick={() => {
              updateSetting('peopleDefaultView', 'direct-reports')
              close()
            }}
          >
            <UserCheck className='w-4 h-4' />
            Direct Reports
          </Link>
          <Link
            href='/people/chart'
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
              isChart && 'bg-accent'
            )}
            onClick={() => {
              updateSetting('peopleDefaultView', 'chart')
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
