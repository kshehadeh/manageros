import { OneOnOneForm } from '@/components/oneonone-form'

import { redirect } from 'next/navigation'
import { Handshake } from 'lucide-react'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'

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
  const user = await getCurrentUser()

  const { participant1Id, participant2Id } = await searchParams
  if (!(await getActionPermission(user, 'oneonone.create'))) {
    redirect('/dashboard')
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
        preFilledManagerId={participant1Id}
        preFilledReportId={participant2Id}
      />
    </div>
  )
}
