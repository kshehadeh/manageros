'use client'

import React from 'react'
import Link from 'next/link'
import { PeopleDataTable } from '@/components/people/data-table'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { useSession } from 'next-auth/react'
import { isAdmin } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Upload, UserPlus, Workflow, User } from 'lucide-react'
import { HelpIcon } from '@/components/help-icon'

export function PeoplePageClient() {
  const { data: session } = useSession()

  return (
    <PageContainer className='px-3 md:px-0'>
      <PageHeader
        title={
          <div className='flex items-center gap-2'>
            People
            <HelpIcon helpId='people' size='md' />
          </div>
        }
        titleIcon={User}
        actions={
          <div className='flex flex-wrap items-center gap-3'>
            <Button asChild variant='outline'>
              <Link href='/people/chart' className='flex items-center gap-2'>
                <Workflow className='w-4 h-4' />
                <span className='hidden sm:inline'>Chart</span>
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
                    <span className='hidden sm:inline'>Import CSV</span>
                  </Link>
                </Button>
                <Button asChild className='flex items-center gap-2'>
                  <Link href='/people/new'>
                    <UserPlus className='w-4 h-4' />
                    <span className='hidden sm:inline'>Create Person</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        }
      />

      <PageContent>
        <PageSection className='-mx-3 md:mx-0'>
          <PeopleDataTable enablePagination={true} limit={100} />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
