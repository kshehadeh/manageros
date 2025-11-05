import { InitiativeForm } from '@/components/initiatives/initiative-form'

interface NewInitiativePageProps {
  searchParams: Promise<{
    ownerId?: string
    teamId?: string
  }>
}

export default async function NewInitiativePage({
  searchParams,
}: NewInitiativePageProps) {
  const { ownerId, teamId } = await searchParams

  return (
    <div className='space-y-6'>
      <InitiativeForm preselectedOwnerId={ownerId} preselectedTeamId={teamId} />
    </div>
  )
}
