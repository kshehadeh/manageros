'use client'

import Link from 'next/link'
import { OrgChartReactFlow } from '@/components/org-chart-reactflow'
import { PeopleList } from '@/components/people-list'
import { useSession } from 'next-auth/react'
import { isAdmin } from '@/lib/auth'
import { useUserSettings } from '@/lib/hooks/use-user-settings'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutGrid, List } from 'lucide-react'

interface Person {
  id: string
  name: string
  email: string | null
  role: string | null
  status: string
  team: { id: string; name: string } | null
  manager: {
    id: string
    name: string
    email: string | null
    role: string | null
    status: string
    reports: Array<{
      id: string
      name: string
      email: string | null
      role: string | null
      status: string
    }>
  } | null
  reports: Array<{
    id: string
    name: string
    email: string | null
    role: string | null
    status: string
  }>
  level: number
}

interface PeoplePageClientProps {
  people: Person[]
}

export function PeoplePageClient({ people }: PeoplePageClientProps) {
  const { data: session } = useSession()
  const { getSetting, updateSetting } = useUserSettings()

  // Get the current view mode from user settings, defaulting to 'chart'
  const viewMode = getSetting('peopleViewMode')

  // Function to handle view mode changes
  const handleViewModeChange = (mode: string) => {
    updateSetting('peopleViewMode', mode as 'list' | 'chart')
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>People</h2>
        <div className='flex items-center gap-3'>
          {/* View Toggle */}
          <Tabs value={viewMode} onValueChange={handleViewModeChange}>
            <TabsList className='border border-neutral-700 bg-neutral-800'>
              <TabsTrigger
                value='chart'
                className='flex items-center gap-2 border border-transparent hover:border-neutral-600 data-[state=active]:bg-neutral-700 data-[state=active]:border-neutral-600 data-[state=active]:shadow-sm data-[state=active]:font-semibold data-[state=active]:text-white'
              >
                <LayoutGrid className='w-4 h-4' />
                Chart
              </TabsTrigger>
              <TabsTrigger
                value='list'
                className='flex items-center gap-2 border border-transparent hover:border-neutral-600 data-[state=active]:bg-neutral-700 data-[state=active]:border-neutral-600 data-[state=active]:shadow-sm data-[state=active]:font-semibold data-[state=active]:text-white'
              >
                <List className='w-4 h-4' />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {session?.user && isAdmin(session.user) && (
            <>
              <Button asChild variant='outline'>
                <Link href='/people/import'>Import CSV</Link>
              </Button>
              <Button asChild variant='outline'>
                <Link href='/people/new'>New</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Conditional Rendering */}
      {viewMode === 'chart' ? (
        <OrgChartReactFlow people={people} />
      ) : (
        <PeopleList people={people} />
      )}
    </div>
  )
}
