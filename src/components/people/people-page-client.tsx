'use client'

import React from 'react'
import Link from 'next/link'
import { GroupedPeoplePageClient } from '@/components/people/grouped-people-page-client'
import { useSession } from 'next-auth/react'
import { isAdmin } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Upload, UserPlus, Workflow, User } from 'lucide-react'
import { Person } from '@/types/person'
import { HelpIcon } from '@/components/help-icon'

interface PeoplePageClientProps {
  people: Person[]
}

export function PeoplePageClient({ people }: PeoplePageClientProps) {
  const { data: session } = useSession()

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-2'>
              <User className='h-6 w-6 text-muted-foreground' />
              <h1 className='page-title'>People</h1>
              <HelpIcon helpId='people' size='md' />
            </div>
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
        <GroupedPeoplePageClient people={people} />
      </div>
    </div>
  )
}
