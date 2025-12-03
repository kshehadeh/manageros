import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { requireAdmin } from '@/lib/auth-utils'
import { getToleranceRules } from '@/lib/actions/tolerance-rules'
import { ToleranceRulesList } from '@/components/tolerance-rules/tolerance-rules-list'
import { RunToleranceCheckButton } from '@/components/tolerance-rules/run-tolerance-check-button'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { AlertTriangle, Plus } from 'lucide-react'

export default async function ToleranceRulesPage() {
  await requireAdmin()

  const rules = await getToleranceRules()

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
        <PageSection
          variant='bordered'
          header={
            <SectionHeader
              icon={AlertTriangle}
              title='Tolerance Rules'
              description='Rules are evaluated daily and create exceptions when thresholds are exceeded. Exceptions appear in notifications and can be acknowledged, ignored, or resolved.'
            />
          }
        >
          <ToleranceRulesList rules={rules} />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
