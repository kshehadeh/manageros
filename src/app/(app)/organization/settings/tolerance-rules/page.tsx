import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { requireAdmin } from '@/lib/auth-utils'
import { ToleranceRulesDataTable } from '@/components/tolerance-rules/tolerance-rules-data-table'
import { ToleranceRulesActionsDropdown } from '@/components/tolerance-rules/tolerance-rules-actions-dropdown'

export default async function ToleranceRulesPage() {
  await requireAdmin()

  return (
    <PageContainer>
      <PageHeader
        title='Tolerance Rules'
        subtitle='Configure organizational tolerance rules that monitor metrics and generate exceptions when thresholds are exceeded.'
        actions={<ToleranceRulesActionsDropdown />}
      />

      <PageContent>
        <ToleranceRulesDataTable settingsId='tolerance-rules-page' />
      </PageContent>
    </PageContainer>
  )
}
