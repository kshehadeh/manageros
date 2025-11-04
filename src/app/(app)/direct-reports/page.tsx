import { PeopleDataTable } from '@/components/people/data-table'
import { Users } from 'lucide-react'
import { HelpIcon } from '@/components/help-icon'
import { PageSection } from '@/components/ui/page-section'
import { getOptionalUser } from '@/lib/auth-utils'

export default async function DirectReportsPage() {
  const user = await getOptionalUser()

  // If user doesn't have a personId, they can't have direct reports
  if (!user?.personId) {
    return (
      <div className='page-container'>
        <div className='page-header'>
          <div className='flex items-center gap-2'>
            <Users className='h-6 w-6 text-muted-foreground' />
            <h1 className='page-title'>Your Direct Reports</h1>
            <HelpIcon helpId='direct-reports' size='md' />
          </div>
        </div>
        <PageSection>
          <div className='text-muted-foreground text-sm text-center py-8'>
            You need to be linked to a person record to view direct reports.
          </div>
        </PageSection>
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

      <PageSection>
        <PeopleDataTable
          settingsId='direct-reports'
          immutableFilters={{
            managerId: user.personId,
            status: 'active',
          }}
        />
      </PageSection>
    </div>
  )
}
