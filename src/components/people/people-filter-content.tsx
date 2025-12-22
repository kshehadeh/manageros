'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface PeopleFilterContentProps {
  settings: { filters: any }
  updateFilters: (filters: Partial<any>) => void
  currentPersonId?: string | null
}

/**
 * Filter content component for people data table
 * Provides filtering options including "Direct Reports"
 */
export function PeopleFilterContent({
  settings,
  updateFilters,
  currentPersonId,
}: PeopleFilterContentProps) {
  const filters = settings.filters
  const isDirectReportsFiltered =
    currentPersonId && filters.managerId === currentPersonId

  const handleDirectReportsToggle = (checked: boolean) => {
    if (checked && currentPersonId) {
      updateFilters({ managerId: currentPersonId })
    } else {
      updateFilters({ managerId: undefined })
    }
  }

  if (!currentPersonId) {
    return null
  }

  return (
    <div className='space-y-md'>
      <div className='flex items-center justify-between'>
        <Label htmlFor='direct-reports-filter' className='text-sm font-normal'>
          Direct Reports
        </Label>
        <Switch
          id='direct-reports-filter'
          checked={!!isDirectReportsFiltered}
          onCheckedChange={handleDirectReportsToggle}
        />
      </div>
    </div>
  )
}
