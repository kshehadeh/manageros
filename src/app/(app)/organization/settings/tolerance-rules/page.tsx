import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { requireAdmin } from '@/lib/auth-utils'
import { ToleranceRulesDataTable } from '@/components/tolerance-rules/tolerance-rules-data-table'
import { RunToleranceCheckButton } from '@/components/tolerance-rules/run-tolerance-check-button'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Plus } from 'lucide-react'

export default async function ToleranceRulesPage() {
  await requireAdmin()

  return (
    <PageContainer>
      <PageHeader
        title='Tolerance Rules'
        subtitle='Configure organizational tolerance rules that monitor metrics and generate exceptions when thresholds are exceeded.'
        actions={
          <div className='flex gap-2'>
            <RunToleranceCheckButton />
            <Button asChild>
              <Link href='/organization/settings/tolerance-rules/new'>
                <Plus className='w-4 h-4 mr-2' />
                Create Rule
              </Link>
            </Button>
          </div>
        }
      />

      <PageContent>
        <ToleranceRulesDataTable settingsId='tolerance-rules-page' />
      </PageContent>
    </PageContainer>
  )
}
