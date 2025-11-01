import Link from 'next/link'
import { requireAuth } from '@/lib/auth-utils'
import { Button } from '@/components/ui/button'
import { Upload, Plus, Workflow, Users2 } from 'lucide-react'
import { TeamsDataTable } from '@/components/teams/data-table'
import { PageSection } from '@/components/ui/page-section'

export default async function TeamsPage() {
  await requireAuth({ requireOrganization: true })

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-2'>
              <Users2 className='h-6 w-6 text-muted-foreground' />
              <h1 className='page-title'>Teams</h1>
            </div>
            <p className='page-subtitle'>
              Manage your organization&apos;s team structure
            </p>
          </div>
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
        </div>
      </div>
      <PageSection>
        <TeamsDataTable enablePagination={true} limit={100} />
      </PageSection>
    </div>
  )
}
