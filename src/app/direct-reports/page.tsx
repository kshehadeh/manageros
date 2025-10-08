import { getDirectReports } from '@/lib/actions/person'
import { PeopleTable } from '@/components/people/people-table'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Users } from 'lucide-react'
import { HelpIcon } from '@/components/help-icon'

export default async function DirectReportsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const user = await getCurrentUser()

  if (!user.organizationId) {
    redirect('/organization/create')
  }

  const directReports = await getDirectReports()

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <div className='flex items-center gap-2'>
              <Users className='h-6 w-6 text-muted-foreground' />
              <h1 className='page-title'>Your Direct Reports</h1>
              <HelpIcon helpId='direct-reports' size='md' />
            </div>
          </div>
          <div className='text-sm text-muted-foreground'>
            {directReports.length} report{directReports.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className='page-section'>
        <PeopleTable people={directReports} />
      </div>
    </div>
  )
}
