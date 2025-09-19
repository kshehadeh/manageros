'use client'

import Link from 'next/link'
import { OrgChartReactFlow } from '@/components/org-chart-reactflow'
import { Button } from '@/components/ui/button'
import { ArrowLeft, LayoutGrid } from 'lucide-react'
import { Person } from '@/types/person'

interface PeopleChartClientProps {
  people: Person[]
}

export function PeopleChartClient({ people }: PeopleChartClientProps) {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Button asChild variant='outline' size='sm'>
            <Link href='/people' className='flex items-center gap-2'>
              <ArrowLeft className='w-4 h-4' />
              Back to People
            </Link>
          </Button>
          <div className='flex items-center gap-2'>
            <LayoutGrid className='w-5 h-5 text-neutral-400' />
            <h2 className='text-lg font-semibold'>Organization Chart</h2>
          </div>
        </div>
      </div>

      <OrgChartReactFlow people={people} />
    </div>
  )
}
