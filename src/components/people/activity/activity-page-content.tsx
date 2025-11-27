import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Activity, ArrowLeft } from 'lucide-react'
import { GithubMetricsSection } from '@/components/github-metrics-section'
import { JiraMetricsSection } from '@/components/jira-metrics-section'

interface ActivityPageContentProps {
  personId: string
  personName: string
  hasJiraAccount: boolean
  hasGithubAccount: boolean
}

export function ActivityPageContent({
  personId,
  personName,
  hasJiraAccount,
  hasGithubAccount,
}: ActivityPageContentProps) {
  const hasAnyIntegration = hasJiraAccount || hasGithubAccount

  return (
    <PageContainer>
      <PageHeader
        title='Activity'
        titleIcon={Activity}
        subtitle={`Recent work activity for ${personName}`}
        actions={
          <Button asChild variant='outline'>
            <Link
              href={`/people/${personId}`}
              className='flex items-center gap-2'
            >
              <ArrowLeft className='w-4 h-4' />
              Back to Profile
            </Link>
          </Button>
        }
      />

      <PageContent>
        <PageMain>
          <div className='flex gap-lg flex-wrapspace-y-6'>
            {/* Jira Metrics */}
            <JiraMetricsSection
              personId={personId}
              hasJiraAccount={hasJiraAccount}
            />

            {/* GitHub Metrics */}
            <GithubMetricsSection
              personId={personId}
              hasGithubAccount={hasGithubAccount}
            />

            {/* Empty state when no data available */}
            {!hasAnyIntegration && (
              <div className='text-center py-12 text-muted-foreground'>
                <Activity className='w-12 h-12 mx-auto mb-4 opacity-50' />
                <p className='text-lg font-medium mb-2'>
                  No activity data available
                </p>
                <p className='text-sm'>
                  Link Jira or GitHub accounts to see work activity.
                </p>
              </div>
            )}
          </div>
        </PageMain>
      </PageContent>
    </PageContainer>
  )
}
