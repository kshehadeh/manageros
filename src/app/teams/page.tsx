import Link from 'next/link'
import { requireAuth } from '@/lib/auth-utils'
import { Button } from '@/components/ui/button'
import { Upload, Plus, Workflow, Users2 } from 'lucide-react'
import { TeamsDataTable } from '@/components/teams/data-table'

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
            <Button asChild variant='outline'>
              <Link href='/teams/new'>
                <Plus className='w-4 h-4' />
                New Team
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <div className='page-section'>
        <TeamsDataTable enablePagination={true} limit={100} />
      </div>
    </div>
  )
}
