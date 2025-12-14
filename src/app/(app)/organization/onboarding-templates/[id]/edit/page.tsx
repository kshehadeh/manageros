import { notFound } from 'next/navigation'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { requireAdmin, getCurrentUser } from '@/lib/auth-utils'
import { OnboardingTemplateForm } from '@/components/onboarding/onboarding-template-form'
import { getOnboardingTemplateById } from '@/lib/actions/onboarding-template'
import { prisma } from '@/lib/db'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditOnboardingTemplatePage({ params }: Props) {
  await requireAdmin()
  const user = await getCurrentUser()
  const { id } = await params

  // Get the template
  let template
  try {
    template = await getOnboardingTemplateById(id)
  } catch {
    notFound()
  }

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
        title='Edit Onboarding Template'
        subtitle={`Editing: ${template.name}`}
      />

      <PageContent>
        <OnboardingTemplateForm
          template={template}
          teams={teams}
          jobRoles={jobRoles}
        />
      </PageContent>
    </PageContainer>
  )
}
