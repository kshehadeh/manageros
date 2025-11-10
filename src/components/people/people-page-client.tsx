'use client'

import React from 'react'
import { Link } from '@/components/ui/link'
import { PeopleDataTable } from '@/components/people/data-table'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Upload, UserPlus, Workflow, User } from 'lucide-react'

export function PeoplePageClient() {
  const { user } = useUser()

  // Get user data from API to check role
  const [userData, setUserData] = React.useState<{ role: string } | null>(null)

  React.useEffect(() => {
    if (user) {
      fetch('/api/user/current')
        .then(res => res.json())
        .then(data => setUserData(data.user))
        .catch(() => {})
    }
  }, [user])

  const isAdmin = userData?.role === 'ADMIN'

  return (
    <PageContainer className='px-3 md:px-0'>
      <PageHeader
        title='People'
        titleIcon={User}
        helpId='people'
        actions={
          <div className='flex flex-wrap items-center gap-3'>
            <Button asChild variant='outline'>
              <Link href='/people/chart' className='flex items-center gap-2'>
                <Workflow className='w-4 h-4' />
                <span className='hidden sm:inline'>Chart</span>
              </Link>
            </Button>

            {isAdmin && (
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
