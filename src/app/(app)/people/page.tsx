import { PeoplePageClient } from '@/components/people/people-page-client'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Workflow, Upload, UserPlus } from 'lucide-react'

export default async function PeoplePage() {
  const user = await getCurrentUser()
  const canCreatePeople = await getActionPermission(user, 'person.create')
  const canImportPeople = await getActionPermission(user, 'person.import')

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

            {canImportPeople && (
              <Button asChild variant='outline'>
                <Link href='/people/import' className='flex items-center gap-2'>
                  <Upload className='w-4 h-4' />
                  <span className='hidden sm:inline'>Import CSV</span>
                </Link>
              </Button>
            )}
            {canCreatePeople && (
              <Button asChild className='flex items-center gap-2'>
                <Link href='/people/new'>
                  <UserPlus className='w-4 h-4' />
                  <span className='hidden sm:inline'>Create Person</span>
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <PageContent>
        <PeoplePageClient />
      </PageContent>
    </PageContainer>
  )
}
