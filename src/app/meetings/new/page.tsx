import { getTeams, getInitiatives, getPeople } from '@/lib/actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MeetingForm } from '@/components/meeting-form'

export default async function NewMeetingPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const [teams, initiatives, people] = await Promise.all([
    getTeams(),
    getInitiatives(),
    getPeople(),
  ])

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>Create New Meeting</h1>
        <p className='text-muted-foreground'>
          Schedule a new meeting for your organization
        </p>
      </div>

      <div className='max-w-2xl'>
        <MeetingForm people={people} teams={teams} initiatives={initiatives} />
      </div>
    </div>
  )
}
