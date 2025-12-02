import { MeetingsPageClient } from '@/components/meetings/meetings-page-client'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Plus, Calendar } from 'lucide-react'

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
          canCreateMeetings ? (
            <Button asChild className='flex items-center gap-2'>
              <Link href='/meetings/new'>
                <Plus className='h-4 w-4' />
                Create Meeting
              </Link>
            </Button>
          ) : null
        }
      />

      <PageContent>
        <MeetingsPageClient />
      </PageContent>
    </PageContainer>
  )
}
