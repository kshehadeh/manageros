import { MeetingsPageClient } from '@/components/meetings/meetings-page-client'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { Calendar } from 'lucide-react'
import { MeetingsListActionsDropdown } from '@/components/meetings/meetings-list-actions-dropdown'

export default async function MeetingsPage() {
  const user = await getCurrentUser()
  const canCreateMeetings = await getActionPermission(user, 'meeting.create')

  return (
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
  )
}
