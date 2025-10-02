import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CheckInForm } from '@/components/checkin-form'
import { InitiativeDetailClient } from '@/components/initiatives/initiative-detail-client'

export default async function EditCheckInPage({
  params,
}: {
  params: Promise<{ id: string; checkInId: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const { id, checkInId } = await params

  // Get the check-in with initiative details
  const checkIn = await prisma.checkIn.findFirst({
    where: {
      id: checkInId,
      initiative: {
        id,
        organizationId: session.user.organizationId,
      },
    },
    include: {
      initiative: true,
    },
  })

  if (!checkIn) {
    redirect(`/initiatives/${id}`)
  }

  return (
    <InitiativeDetailClient
      initiativeTitle={checkIn.initiative.title}
      initiativeId={checkIn.initiative.id}
    >
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <div>
            <h1 className='text-2xl font-bold'>Edit Check-in</h1>
            <p className='text-neutral-400'>
              Edit check-in for {checkIn.initiative.title}
            </p>
          </div>
        </div>

        <div className='card'>
          <CheckInForm
            initiativeId={checkIn.initiative.id}
            initiativeTitle={checkIn.initiative.title}
            checkIn={{
              id: checkIn.id,
              weekOf: checkIn.weekOf.toISOString(),
              rag: checkIn.rag,
              confidence: checkIn.confidence,
              summary: checkIn.summary,
              blockers: checkIn.blockers,
              nextSteps: checkIn.nextSteps,
            }}
          />
        </div>
      </div>
    </InitiativeDetailClient>
  )
}
