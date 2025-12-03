import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { requireAdmin } from '@/lib/auth-utils'
import { ToleranceRuleForm } from '@/components/tolerance-rules/tolerance-rule-form'
import { AlertTriangle } from 'lucide-react'

export default async function NewToleranceRulePage() {
  await requireAdmin()

  return (
    <PageContainer>
      <PageHeader
        title='Create Tolerance Rule'
        subtitle='Configure a new tolerance rule to monitor organizational metrics.'
      />

      <PageContent>
        <PageSection
          variant='bordered'
          header={
            <SectionHeader icon={AlertTriangle} title='Rule Configuration' />
          }
        >
          <ToleranceRuleForm />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
