import { InitiativeForm } from '@/components/initiatives/initiative-form'
import { Rocket } from 'lucide-react'
import { HelpIcon } from '@/components/help-icon'

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
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Rocket className='h-5 w-5 text-muted-foreground' />
          <h2 className='text-lg font-semibold'>New Initiative</h2>
          <HelpIcon helpId='initiatives' size='md' />
        </div>
      </div>

      <InitiativeForm preselectedOwnerId={ownerId} preselectedTeamId={teamId} />
    </div>
  )
}
