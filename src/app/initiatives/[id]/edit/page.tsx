import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { InitiativeEditForm } from '@/components/initiative-edit-form'
import { Button } from '@/components/ui/button'

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
  const [teams, people] = await Promise.all([
    prisma.team.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { name: 'asc' },
    }),
    prisma.person.findMany({
      where: {
        status: 'active',
        organizationId: session.user.organizationId,
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>Edit Initiative</h1>
        <Button asChild variant='outline'>
          <a href={`/initiatives/${id}`}>Back to Initiative</a>
        </Button>
      </div>

      <InitiativeEditForm
        initiative={initiative}
        teams={teams}
        people={people}
      />
    </div>
  )
}
