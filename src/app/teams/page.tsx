import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { HierarchicalTeamView } from '@/components/hierarchical-team-view'
import { getTeamHierarchyOptimized } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Upload, Plus, Workflow } from 'lucide-react'

export default async function TeamsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const teams = await getTeamHierarchyOptimized()

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='page-title'>Teams</h1>
            <p className='page-subtitle'>
              Hierarchical team structure with expand/collapse controls
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
      <HierarchicalTeamView teams={teams} />
    </div>
  )
}
