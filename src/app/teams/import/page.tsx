import { redirect } from 'next/navigation'
import { TeamImportForm } from '@/components/team-import-form'
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
    <div className='min-h-screen bg-black'>
      <TeamImportForm />
    </div>
  )
}
