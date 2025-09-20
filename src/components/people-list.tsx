'use client'

import Link from 'next/link'

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

interface PeopleListProps {
  people: Person[]
}

export function PeopleList({ people }: PeopleListProps) {
  if (people.length === 0) {
    return <div className='text-muted-foreground text-sm'>No people yet.</div>
  }

  return (
    <div className='grid gap-3'>
      {people.map(person => (
        <Link
          key={person.id}
          href={`/people/${person.id}`}
          className='block p-4 bg-card border rounded-lg hover:bg-accent transition-colors'
        >
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-3'>
                <div className='flex items-center gap-2'>
                  <div className={`w-3 h-3 rounded-full ${person.status === 'active' ? 'bg-emerald-500' : person.status === 'inactive' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <h3 className='font-semibold text-foreground'>
                    {person.name}
                  </h3>
                </div>
                {person.role && (
                  <span className='text-sm text-muted-foreground'>
                    {person.role}
                  </span>
                )}
              </div>
              <div className='mt-1 flex items-center gap-4 text-sm text-muted-foreground'>
                {person.email && <span>{person.email}</span>}
                {person.team && (
                  <span className='bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs'>
                    {person.team.name}
                  </span>
                )}
                {person.manager && (
                  <span className='text-xs'>
                    Reports to: {person.manager.name}
                  </span>
                )}
                {person.reports.length > 0 && (
                  <span className='text-xs'>
                    {person.reports.length} direct report
                    {person.reports.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {person.reports.length > 0 && (
                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary'>
                  {person.reports.length} reports
                </span>
              )}
              <svg
                className='w-4 h-4 text-muted-foreground'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
