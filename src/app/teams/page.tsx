import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TeamsPageClient } from '@/components/teams-page-client'
import { getAllTeamsWithRelations } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Upload, Plus, Workflow, Users2 } from 'lucide-react'

export default async function TeamsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

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
