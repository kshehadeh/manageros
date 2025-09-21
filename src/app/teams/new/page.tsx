import { TeamForm } from '@/components/team-form'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

interface NewTeamPageProps {
  searchParams: Promise<{
    parentId?: string
  }>
}

export default async function NewTeamPage({ searchParams }: NewTeamPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const { parentId } = await searchParams

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>New Team</h2>
      </div>

      <TeamForm parentId={parentId} />
    </div>
  )
}
