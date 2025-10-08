import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { InitiativeEditForm } from '@/components/initiatives/initiative-edit-form'
import { InitiativeDetailClient } from '@/components/initiatives/initiative-detail-client'
import { Rocket } from 'lucide-react'

export default async function EditInitiative({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
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
  const [teams] = await Promise.all([
    prisma.team.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <InitiativeDetailClient
      initiativeTitle={initiative.title}
      initiativeId={initiative.id}
    >
      <div className='px-4 lg:px-0'>
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Rocket className='h-6 w-6 text-muted-foreground' />
              <h1 className='text-xl font-semibold'>Edit Initiative</h1>
            </div>
          </div>

          <InitiativeEditForm initiative={initiative} teams={teams} />
        </div>
      </div>
    </InitiativeDetailClient>
  )
}
