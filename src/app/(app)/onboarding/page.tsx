import { redirect } from 'next/navigation'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { getCurrentUser } from '@/lib/auth-utils'
import { getMyOnboardingInstance } from '@/lib/actions/onboarding-instance'
import { OnboardingChecklist } from '@/components/onboarding/onboarding-checklist'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList } from 'lucide-react'

export default async function OnboardingPage() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId || !user.managerOSPersonId) {
    redirect('/dashboard')
  }

  const instance = await getMyOnboardingInstance()

  if (!instance) {
    return (
      <PageContainer>
        <PageHeader
          title='Onboarding'
          subtitle='Track your onboarding progress'
        />
        <PageContent>
          <Card>
            <CardContent className='py-12 text-center'>
              <ClipboardList className='w-12 h-12 mx-auto text-muted-foreground mb-4' />
              <h3 className='text-lg font-medium mb-2'>No Active Onboarding</h3>
              <p className='text-muted-foreground'>
                You don&apos;t have any active onboarding assigned. Contact your
                manager if you believe this is a mistake.
              </p>
            </CardContent>
          </Card>
        </PageContent>
      </PageContainer>
    )
  }

  // Determine if current user can complete checkpoint items
  const isCheckpointCompleter =
    instance.managerId === user.managerOSPersonId ||
    instance.mentorId === user.managerOSPersonId

  return (
    <PageContainer>
      <PageHeader
        title='Your Onboarding'
        subtitle={`Welcome! Complete these items to get up to speed.`}
      />
      <PageContent>
        <OnboardingChecklist
          templateName={instance.template.name}
          templateDescription={instance.template.description}
          phases={instance.phases}
          progress={instance.progress}
          manager={instance.manager}
          mentor={instance.mentor}
          isCheckpointCompleter={isCheckpointCompleter}
        />
      </PageContent>
    </PageContainer>
  )
}
