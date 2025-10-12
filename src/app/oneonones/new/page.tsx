import { OneOnOneForm } from '@/components/oneonone-form'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
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

  // Extract participant IDs from URL parameters
  // Validation will be done client-side using the people cache
  const participant1Id = params.participant1Id || params.managerId
  const participant2Id = params.participant2Id || params.reportId

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold flex items-center gap-2'>
          <Handshake className='w-5 h-5' />
          New 1:1 Meeting
        </h2>
      </div>

      <OneOnOneForm
        preFilledManagerId={participant1Id}
        preFilledReportId={participant2Id}
      />
    </div>
  )
}
