import { prisma } from '@/lib/db'
import { PersonDetailClient } from '@/components/people/person-detail-client'
import { PersonDetailContent } from '@/components/people/person-detail-content'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getLinkedAccountAvatars } from '@/lib/actions/avatar'

interface PersonDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PersonDetailPage({
  params,
}: PersonDetailPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const { id } = await params

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const person = await prisma.person.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      team: true,
      manager: {
        include: {
          reports: true,
        },
      },
      reports: true,
      jobRole: {
        include: {
          level: true,
          domain: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      jiraAccount: true,
      githubAccount: true,
    },
  })

  if (!person) {
    notFound()
  }

  // Add level field to match Person type requirements
  const personWithLevel = {
    ...person,
    level: 0, // Default level, can be calculated based on hierarchy if needed
  }

  // Get the current user's person record to determine relationships
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: session.user.id,
      },
    },
    include: {
      team: true,
      manager: {
        include: {
          reports: true,
        },
      },
      reports: true,
      jobRole: {
        include: {
          level: true,
          domain: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      jiraAccount: true,
      githubAccount: true,
    },
  })

  // Add level field to currentPerson if it exists
  const currentPersonWithLevel = currentPerson
    ? {
        ...currentPerson,
        level: 0, // Default level, can be calculated based on hierarchy if needed
      }
    : undefined

  // Get linked account avatars
  let linkedAvatars: { jiraAvatar?: string; githubAvatar?: string } = {}
  try {
    linkedAvatars = await getLinkedAccountAvatars(id)
  } catch (error) {
    console.error('Error fetching linked account avatars:', error)
  }

  return (
    <PersonDetailClient
      personName={personWithLevel.name}
      personId={personWithLevel.id}
    >
      <PersonDetailContent
        person={personWithLevel}
        linkedAvatars={linkedAvatars}
        isAdmin={isAdmin(session.user)}
        currentPerson={currentPersonWithLevel}
      />
    </PersonDetailClient>
  )
}
