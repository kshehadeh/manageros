import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { requireAdmin, getCurrentUser } from '@/lib/auth-utils'
import { OnboardingTemplateForm } from '@/components/onboarding/onboarding-template-form'
import { prisma } from '@/lib/db'

export default async function NewOnboardingTemplatePage() {
  await requireAdmin()
  const user = await getCurrentUser()

  // Get teams and job roles for the form
  const [teams, jobRoles] = await Promise.all([
    prisma.team.findMany({
      where: { organizationId: user.managerOSOrganizationId! },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.jobRole.findMany({
      where: { organizationId: user.managerOSOrganizationId! },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
  ])

  return (
    <PageContainer>
      <PageHeader
        title='New Onboarding Template'
        subtitle='Create a new onboarding template with phases and items to guide new team members.'
      />

      <PageContent>
        <OnboardingTemplateForm teams={teams} jobRoles={jobRoles} />
      </PageContent>
    </PageContainer>
  )
}
