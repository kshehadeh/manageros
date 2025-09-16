'use client'

import Link from 'next/link'
import { useState } from 'react'
import { OrgChartReactFlow } from '@/components/org-chart-reactflow'
import { PeopleList } from '@/components/people-list'
import { useSession } from 'next-auth/react'
import { isAdmin } from '@/lib/auth'

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
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('chart')
  const { data: session } = useSession()

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>People</h2>
        <div className='flex items-center gap-3'>
          {/* View Toggle */}
          <div className='flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1'>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'chart'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <div className='flex items-center gap-2'>
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                  />
                </svg>
                Chart
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <div className='flex items-center gap-2'>
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 10h16M4 14h16M4 18h16'
                  />
                </svg>
                List
              </div>
            </button>
          </div>

          {session?.user && isAdmin(session.user) && (
            <>
              <Link href='/people/import' className='btn-secondary'>
                Import CSV
              </Link>
              <Link href='/people/new' className='btn'>
                New
              </Link>
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
