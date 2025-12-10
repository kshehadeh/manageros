import { redirect } from 'next/navigation'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { requireAdmin } from '@/lib/auth-utils'
import { getToleranceRuleById } from '@/lib/actions/tolerance-rules'
import { ToleranceRuleForm } from '@/components/tolerance-rules/tolerance-rule-form'
import { AlertTriangle } from 'lucide-react'

interface ToleranceRuleEditPageProps {
  params: Promise<{ id: string }>
}

export default async function ToleranceRuleEditPage({
  params,
}: ToleranceRuleEditPageProps) {
  await requireAdmin()

  const { id } = await params
  const rule = await getToleranceRuleById(id)

  if (!rule) {
    redirect('/organization/settings/tolerance-rules')
  }

  return (
    <PageContainer>
      <PageHeader
        title='Edit Tolerance Rule'
        subtitle='Update the tolerance rule configuration.'
      />

      <PageContent>
        <PageSection
          header={
            <SectionHeader icon={AlertTriangle} title='Rule Configuration' />
          }
        >
          <ToleranceRuleForm rule={rule} />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
