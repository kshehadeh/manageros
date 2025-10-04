import { PersonForm } from '@/components/people/person-form'
import {
  getTeams,
  getPeople,
  getPerson,
  getJobRolesForSelection,
  getLinkedAccountAvatars,
} from '@/lib/actions'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PersonDetailClient } from '@/components/people/person-detail-client'

interface EditPersonPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditPersonPage({ params }: EditPersonPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check if user is admin
  if (!isAdmin(session.user)) {
    redirect('/people')
  }

  const { id } = await params
  const [teams, people, jobRoles, person, jiraAccount, githubAccount] =
    await Promise.all([
      getTeams(),
      getPeople(),
      getJobRolesForSelection(),
      getPerson(id),
      prisma.personJiraAccount.findFirst({
        where: { personId: id },
      }),
      prisma.personGithubAccount.findFirst({
        where: { personId: id },
      }),
    ])

  if (!person) {
    notFound()
  }

  // Get linked account avatars
  let linkedAvatars: { jiraAvatar?: string; githubAvatar?: string } = {}
  try {
    linkedAvatars = await getLinkedAccountAvatars(id)
  } catch (error) {
    console.error('Error fetching linked account avatars:', error)
  }

  return (
    <PersonDetailClient personName={person.name} personId={person.id}>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Edit {person.name}</h2>
        </div>

        <PersonForm
          teams={teams}
          people={people}
          jobRoles={jobRoles}
          person={person}
          linkedAvatars={linkedAvatars}
          jiraAccount={jiraAccount}
          githubAccount={githubAccount}
        />
      </div>
    </PersonDetailClient>
  )
}
