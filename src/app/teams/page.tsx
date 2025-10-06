import Link from 'next/link'
import { requireAuth } from '@/lib/auth-utils'
import { TeamsPageClient } from '@/components/teams/teams-page-client'
import { getAllTeamsWithRelations } from '@/lib/actions/team'
import { Button } from '@/components/ui/button'
import { Upload, Plus, Workflow, Users2 } from 'lucide-react'

export default async function TeamsPage() {
  await requireAuth({ requireOrganization: true })

  const teams = await getAllTeamsWithRelations()

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
      <TeamsPageClient teams={teams} />
    </div>
  )
}
