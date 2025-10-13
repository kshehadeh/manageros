import { PeopleDataTable } from '@/components/people/data-table'
import { requireAuth } from '@/lib/auth-utils'
import { Users } from 'lucide-react'
import { HelpIcon } from '@/components/help-icon'

export default async function DirectReportsPage() {
  const user = await requireAuth({ requireOrganization: true })

  // If user doesn't have a personId, they can't have direct reports
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
          <div className='text-muted-foreground text-sm text-center py-8'>
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
      </div>

      <div className='page-section'>
        <PeopleDataTable
          settingsId='direct-reports'
          immutableFilters={{
            managerId: user.personId,
            status: 'active',
          }}
        />
      </div>
    </div>
  )
}
