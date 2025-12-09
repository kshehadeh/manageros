import { MeetingsPageClient } from '@/components/meetings/meetings-page-client'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { Calendar } from 'lucide-react'
import { MeetingsListActionsDropdown } from '@/components/meetings/meetings-list-actions-dropdown'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'

export default async function MeetingsPage() {
  const user = await getCurrentUser()
  const canCreateMeetings = await getActionPermission(user, 'meeting.create')

  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Meetings', href: '/meetings' },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>
        <PageHeader
          title='Meetings'
          titleIcon={Calendar}
          helpId='meetings-communication/meetings'
          subtitle="Manage and track your organization's meetings"
          actions={
            <MeetingsListActionsDropdown canCreateMeeting={canCreateMeetings} />
          }
        />

        <PageContent>
          <MeetingsPageClient />
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
