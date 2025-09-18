import { getDirectReports } from '@/lib/actions'
import { DirectReportsCards } from '@/components/direct-reports-cards'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'

export default async function DirectReportsPage() {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    redirect('/organization/create')
  }

  const directReports = await getDirectReports()

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-white'>Direct Reports</h1>
          <p className='text-neutral-400 mt-1'>
            Manage and view your team members
          </p>
        </div>
        <div className='text-sm text-neutral-500'>
          {directReports.length} report{directReports.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Direct Reports Cards */}
      <DirectReportsCards directReports={directReports} />
    </div>
  )
}
