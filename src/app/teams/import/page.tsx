import { redirect } from 'next/navigation'
import { TeamImportForm } from '@/components/teams/team-import-form'
import { getCurrentUser } from '@/lib/auth-utils'

export default async function ImportTeamsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  if (!user.organizationId) {
    redirect('/organization/create')
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>Import Teams</h2>
      </div>

      <TeamImportForm />
    </div>
  )
}
