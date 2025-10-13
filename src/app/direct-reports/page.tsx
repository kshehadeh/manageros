import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Users } from 'lucide-react'
import { HelpIcon } from '@/components/help-icon'
import { DirectReportsClient } from '@/components/people/direct-reports-client'

export default async function DirectReportsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const user = await getCurrentUser()

  if (!user.organizationId) {
    redirect('/organization/create')
  }

  if (!user.personId) {
    return (
      <div className='page-container'>
        <div className='page-header'>
          <div className='flex items-center gap-2'>
            <Users className='h-6 w-6 text-muted-foreground' />
            <h1 className='page-title'>Your Direct Reports</h1>
            <HelpIcon helpId='direct-reports' size='md' />
          </div>
        </div>
        <div className='page-section'>
          <div className='text-center py-8 text-muted-foreground'>
            You need to be linked to a person record to view direct reports.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-center gap-2'>
          <Users className='h-6 w-6 text-muted-foreground' />
          <h1 className='page-title'>Your Direct Reports</h1>
          <HelpIcon helpId='direct-reports' size='md' />
        </div>
        <p className='page-subtitle mt-2'>
          View and manage people who report directly to you
        </p>
      </div>

      <div className='page-section'>
        <DirectReportsClient managerId={user.personId} />
      </div>
    </div>
  )
}
