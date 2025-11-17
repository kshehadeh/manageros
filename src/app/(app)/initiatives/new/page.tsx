import { InitiativeForm } from '@/components/initiatives/initiative-form'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'

interface NewInitiativePageProps {
  searchParams: Promise<{
    ownerId?: string
    teamId?: string
  }>
}

export default async function NewInitiativePage({
  searchParams,
}: NewInitiativePageProps) {
  const user = await getCurrentUser()

  // Check if user can create initiatives (admin/owner or has linked person)
  const canCreateInitiatives = await getActionPermission(
    user,
    'initiative.create'
  )
  if (!canCreateInitiatives) {
    redirect('/initiatives')
  }

  const { ownerId, teamId } = await searchParams

  return (
    <div className='space-y-6'>
      <InitiativeForm preselectedOwnerId={ownerId} preselectedTeamId={teamId} />
    </div>
  )
}
