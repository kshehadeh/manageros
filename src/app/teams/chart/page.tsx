import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TeamsFlowChart } from '@/components/teams/teams-flow-chart'
import { getTeamHierarchyOptimized } from '@/lib/actions/team'

export default async function TeamsFlowPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const teams = await getTeamHierarchyOptimized()

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div>
            <h2 className='text-lg font-semibold'>Team Hierarchy</h2>
            <p className='text-sm text-neutral-400 mt-1'>
              Interactive team hierarchy visualization
            </p>
          </div>
        </div>
      </div>
      <TeamsFlowChart teams={teams} />
    </div>
  )
}
