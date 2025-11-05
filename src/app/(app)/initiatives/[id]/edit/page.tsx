import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { InitiativeForm } from '@/components/initiatives/initiative-form'
import { InitiativeDetailClient } from '@/components/initiatives/initiative-detail-client'

export default async function EditInitiative({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user.organizationId) {
    redirect('/organization/create')
  }

  const { id } = await params

  // Get the initiative with all related data
  const initiative = await prisma.initiative.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      objectives: { orderBy: { sortIndex: 'asc' } },
      owners: {
        include: {
          person: true,
        },
      },
      team: true,
    },
  })

  if (!initiative) {
    redirect('/initiatives')
  }

  // Get teams and people for the form
  // Teams are now fetched via cache in the component

  return (
    <InitiativeDetailClient
      initiativeTitle={initiative.title}
      initiativeId={initiative.id}
    >
      <div className='px-4 lg:px-0'>
        <InitiativeForm initiative={initiative} />
      </div>
    </InitiativeDetailClient>
  )
}
