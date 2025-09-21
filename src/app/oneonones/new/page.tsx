import { getPeopleForOneOnOne } from '@/lib/actions'
import { OneOnOneForm } from '@/components/oneonone-form'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

interface NewOneOnOnePageProps {
  searchParams: Promise<{
    managerId?: string
    reportId?: string
  }>
}

export default async function NewOneOnOnePage({
  searchParams,
}: NewOneOnOnePageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const params = await searchParams
  const people = await getPeopleForOneOnOne()

  // Get the current user's person record to determine relationships
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: session.user.id,
      },
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Determine the correct pre-fill values based on the relationship
  let validManagerId: string | undefined
  let validReportId: string | undefined

  if (params.managerId) {
    // If managerId is provided, check if it's valid
    if (people.some(p => p.id === params.managerId)) {
      validManagerId = params.managerId
    }
  }

  if (params.reportId) {
    // If reportId is provided, check if it's valid
    if (people.some(p => p.id === params.reportId)) {
      validReportId = params.reportId
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>New 1:1 Meeting</h1>
          <p className='text-neutral-600 mt-1'>
            Schedule a new one-on-one meeting
          </p>
        </div>
      </div>

      <OneOnOneForm
        people={people}
        preFilledManagerId={validManagerId}
        preFilledReportId={validReportId}
      />
    </div>
  )
}
