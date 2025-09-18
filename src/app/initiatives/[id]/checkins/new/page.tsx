import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CheckInForm } from '@/components/checkin-form'
import Link from 'next/link'

export default async function NewCheckInPage({
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
  const initiative = await prisma.initiative.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  })

  if (!initiative) {
    redirect('/initiatives')
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Link
          href={`/initiatives/${initiative.id}`}
          className='btn bg-neutral-700 hover:bg-neutral-600'
        >
          ← Back to Initiative
        </Link>
        <div>
          <h1 className='text-2xl font-bold'>New Check-in</h1>
          <p className='text-neutral-400'>
            Add a progress update for {initiative.title}
          </p>
        </div>
      </div>

      <div className='card'>
        <CheckInForm
          initiativeId={initiative.id}
          initiativeTitle={initiative.title}
        />
      </div>
    </div>
  )
}
