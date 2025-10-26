import { PersonForm } from '@/components/people/person-form'
import { PersonEditHeader } from '@/components/people/person-edit-header'
import { getPerson } from '@/lib/actions/person'
import { getJobRolesForSelection } from '@/lib/actions/job-roles'
import { getLinkedAccountAvatars } from '@/lib/actions/avatar'
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
  const [jobRoles, person, jiraAccount, githubAccount, linkedAvatars] =
    await Promise.all([
      getJobRolesForSelection(),
      getPerson(id),
      prisma.personJiraAccount.findFirst({
        where: { personId: id },
      }),
      prisma.personGithubAccount.findFirst({
        where: { personId: id },
      }),
      getLinkedAccountAvatars(id).catch(() => ({
        jiraAvatar: null,
        githubAvatar: null,
      })),
    ])

  if (!person) {
    notFound()
  }

  return (
    <PersonDetailClient personName={person.name} personId={person.id}>
      <div className='space-y-6'>
        <PersonEditHeader
          personId={person.id}
          personName={person.name}
          currentAvatar={person.avatar || null}
          jiraAvatar={linkedAvatars?.jiraAvatar}
          githubAvatar={linkedAvatars?.githubAvatar}
        />

        <PersonForm
          jobRoles={jobRoles}
          person={person}
          jiraAccount={jiraAccount}
          githubAccount={githubAccount}
        />
      </div>
    </PersonDetailClient>
  )
}
