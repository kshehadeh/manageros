import { getJiraCredentials } from '@/lib/actions/jira'
import { getGithubCredentials } from '@/lib/actions/github'
import { JiraCredentialsSection } from '@/components/settings/jira-credentials-section'
import { GithubCredentialsSection } from '@/components/settings/github-credentials-section'
import { UserInfoSection } from '@/components/settings/user-info-section'
import { PersonLinkForm } from '@/components/people/person-link-form'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { User, Settings, Shield } from 'lucide-react'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '../../../lib/auth-utils'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  const [jiraCredentials, githubCredentials] = await Promise.all([
    getJiraCredentials(),
    getGithubCredentials(),
  ])

  return (
    <PageContainer>
      <PageHeader
        title='Settings'
        subtitle='Manage your account settings and integrations.'
      />

      <PageContent>
        <div className='space-y-6'>
          {/* User Info */}
          <PageSection
            variant='bordered'
            header={<SectionHeader icon={User} title='User Info' />}
          >
            <UserInfoSection email={user.email} userId={user.id} />
          </PageSection>

          {/* Account Linking and Permissions - Side by side on larger screens */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Person Linking Section */}
            <PageSection
              variant='bordered'
              header={<SectionHeader icon={User} title='Account Linking' />}
            >
              <PersonLinkForm />
            </PageSection>

            {/* Permissions Section */}
            <PageSection
              variant='bordered'
              header={<SectionHeader icon={Shield} title='Permissions' />}
            >
              <p className='text-sm text-muted-foreground'>
                View your access permissions for all actions in the system
              </p>
              <Button asChild variant='outline' className='mt-4'>
                <Link
                  href='/settings/permissions'
                  className='flex items-center gap-2'
                >
                  <Shield className='w-4 h-4' />
                  View Permissions
                </Link>
              </Button>
            </PageSection>
          </div>

          {/* Integration Settings */}
          <PageSection
            variant='bordered'
            header={
              <SectionHeader icon={Settings} title='Integration Settings' />
            }
          >
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <JiraCredentialsSection initialCredentials={jiraCredentials} />
              <GithubCredentialsSection
                initialCredentials={githubCredentials}
              />
            </div>
          </PageSection>
        </div>
      </PageContent>
    </PageContainer>
  )
}
