import { prisma } from '@/lib/db'

import { redirect } from 'next/navigation'
import { InitiativeForm } from '@/components/initiatives/initiative-form'
import { InitiativeDetailClient } from '@/components/initiatives/initiative-detail-client'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'

export default async function EditInitiative({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    redirect('/dashboard')
  }

  const { id } = await params

  // Check permission to edit initiatives
  if (!(await getActionPermission(user, 'initiative.edit', id))) {
    redirect(`/initiatives/${id}`)
  }

  // Get the initiative with all related data
  const initiative = await prisma.initiative.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
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
