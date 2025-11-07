import Link from 'next/link'
import { requireAuth } from '@/lib/auth-utils'
import { Button } from '@/components/ui/button'
import { Upload, Plus, Workflow, Users2 } from 'lucide-react'
import { TeamsDataTable } from '@/components/teams/data-table'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'

export default async function TeamsPage() {
  await requireAuth({ requireOrganization: true })

  return (
    <PageContainer>
      <PageHeader
        title='Teams'
        titleIcon={Users2}
        subtitle="Manage your organization's team structure"
        actions={
          <div className='flex gap-2'>
            <Button asChild variant='outline'>
              <Link href='/teams/chart'>
                <Workflow className='w-4 h-4' />
                Chart
              </Link>
            </Button>
            <Button asChild variant='outline'>
              <Link href='/teams/import'>
                <Upload className='w-4 h-4' />
                Import Teams
              </Link>
            </Button>
            <Button asChild className='flex items-center gap-2'>
              <Link href='/teams/new'>
                <Plus className='w-4 h-4' />
                Create Team
              </Link>
            </Button>
          </div>
        }
      />
      <PageContent>
        <PageSection>
          <TeamsDataTable enablePagination={true} limit={100} />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
