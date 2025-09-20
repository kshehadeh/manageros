'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PeopleTable } from '@/components/people-table'
import { PeopleFilterBar } from '@/components/people-filter-bar'
import { useSession } from 'next-auth/react'
import { isAdmin } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Upload, UserPlus, Workflow } from 'lucide-react'
import { Person } from '@/types/person'

interface PeoplePageClientProps {
  people: Person[]
}

export function PeoplePageClient({ people }: PeoplePageClientProps) {
  const { data: session } = useSession()
  const [filteredPeople, setFilteredPeople] = useState<Person[]>(people)

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='page-title'>People</h1>
          </div>
          <div className='flex items-center gap-3'>
            <Button asChild variant='outline'>
              <Link href='/people/chart' className='flex items-center gap-2'>
                <Workflow className='w-4 h-4' />
                Chart
              </Link>
            </Button>

            {session?.user && isAdmin(session.user) && (
              <>
                <Button asChild variant='outline'>
                  <Link
                    href='/people/import'
                    className='flex items-center gap-2'
                  >
                    <Upload className='w-4 h-4' />
                    Import CSV
                  </Link>
                </Button>
                <Button asChild variant='outline'>
                  <Link href='/people/new' className='flex items-center gap-2'>
                    <UserPlus className='w-4 h-4' />
                    New Person
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className='page-section'>
        <PeopleFilterBar
          people={people}
          onFilteredPeopleChange={setFilteredPeople}
        />

        <PeopleTable people={people} filteredPeople={filteredPeople} />
      </div>
    </div>
  )
}
