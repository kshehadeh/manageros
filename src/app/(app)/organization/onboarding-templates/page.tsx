import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { requireAdmin } from '@/lib/auth-utils'
import { OnboardingTemplatesList } from '@/components/onboarding/onboarding-templates-list'
import { OnboardingTemplatesActionsDropdown } from '@/components/onboarding/onboarding-templates-actions-dropdown'
import { getOnboardingTemplates } from '@/lib/actions/onboarding-template'

export default async function OnboardingTemplatesPage() {
  await requireAdmin()

  const templates = await getOnboardingTemplates()

  return (
    <PageContainer>
      <PageHeader
        title='Onboarding Templates'
        subtitle='Create and manage onboarding templates for new team members. Templates define the phases and items that guide people through their first days and weeks.'
        actions={<OnboardingTemplatesActionsDropdown />}
      />

      <PageContent>
        <OnboardingTemplatesList templates={templates} />
      </PageContent>
    </PageContainer>
  )
}
