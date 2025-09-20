'use client'

import { OrgChartReactFlow } from '@/components/org-chart-reactflow'
import { Workflow } from 'lucide-react'
import { Person } from '@/types/person'

interface PeopleChartClientProps {
  people: Person[]
}

export function PeopleChartClient({ people }: PeopleChartClientProps) {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <Workflow className='w-5 h-5 text-neutral-400' />
            <h2 className='text-lg font-semibold'>Organization Chart</h2>
          </div>
        </div>
      </div>

      <OrgChartReactFlow people={people} />
    </div>
  )
}
