import { getPeopleForOneOnOne } from '@/lib/actions/person'
import { OneOnOneForm } from '@/components/oneonone-form'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Handshake } from 'lucide-react'

interface NewOneOnOnePageProps {
  searchParams: Promise<{
    participant1Id?: string
    participant2Id?: string
    managerId?: string // Legacy support
    reportId?: string // Legacy support
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

  // Determine the correct pre-fill values based on URL parameters
  let validParticipant1Id: string | undefined
  let validParticipant2Id: string | undefined

  // Handle new participant parameters
  if (params.participant1Id) {
    if (people.some(p => p.id === params.participant1Id)) {
      validParticipant1Id = params.participant1Id
    }
  }

  if (params.participant2Id) {
    if (people.some(p => p.id === params.participant2Id)) {
      validParticipant2Id = params.participant2Id
    }
  }

  // Legacy support for old managerId/reportId parameters
  if (!validParticipant1Id && params.managerId) {
    if (people.some(p => p.id === params.managerId)) {
      validParticipant1Id = params.managerId
    }
  }

  if (!validParticipant2Id && params.reportId) {
    if (people.some(p => p.id === params.reportId)) {
      validParticipant2Id = params.reportId
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold flex items-center gap-2'>
          <Handshake className='w-5 h-5' />
          New 1:1 Meeting
        </h2>
      </div>

      <OneOnOneForm
        people={people}
        preFilledManagerId={validParticipant1Id}
        preFilledReportId={validParticipant2Id}
      />
    </div>
  )
}
