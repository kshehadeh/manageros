import { TeamForm } from '@/components/teams/team-form'

interface NewTeamPageProps {
  searchParams: Promise<{
    parentId?: string
  }>
}

export default async function NewTeamPage({ searchParams }: NewTeamPageProps) {
  const { parentId } = await searchParams

  return (
    <div className='space-y-6'>
      <TeamForm parentId={parentId} />
    </div>
  )
}
