import { prisma } from '@/lib/db'

import { redirect } from 'next/navigation'
import { CheckInFormContent } from '@/components/checkin-form-content'
import { InitiativeDetailClient } from '@/components/initiatives/initiative-detail-client'
import { getCurrentUser } from '@/lib/auth-utils'

export default async function NewCheckInPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    redirect('/organization/create')
  }

  const { id } = await params
  const initiative = await prisma.initiative.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!initiative) {
    redirect('/initiatives')
  }

  return (
    <InitiativeDetailClient
      initiativeTitle={initiative.title}
      initiativeId={initiative.id}
    >
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <div>
            <h1 className='text-2xl font-bold'>New Check-in</h1>
            <p className='text-neutral-400'>
              Add a progress update for {initiative.title}
            </p>
          </div>
        </div>

        <div className='card'>
          <CheckInFormContent
            initiativeId={initiative.id}
            initiativeTitle={initiative.title}
          />
        </div>
      </div>
    </InitiativeDetailClient>
  )
}
