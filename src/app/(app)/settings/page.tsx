import { getJiraCredentials } from '@/lib/actions/jira'
import { getGithubCredentials } from '@/lib/actions/github'
import { getAvailablePersonsForSelfLinking } from '@/lib/actions/organization'
import { JiraCredentialsSection } from '@/components/settings/jira-credentials-section'
import { GithubCredentialsSection } from '@/components/settings/github-credentials-section'
import { UserInfoSection } from '@/components/settings/user-info-section'
import { OnboardingPreferenceSection } from '@/components/settings/onboarding-preference-section'
import { PersonLinkForm } from '@/components/people/person-link-form'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { User, Settings, Sliders } from 'lucide-react'
import { getCurrentUserWithPersonAndOrganization } from '../../../lib/auth-utils'
import { cn } from '../../../lib/utils'

export default async function SettingsPage() {
  const { user, person, organization } =
    await getCurrentUserWithPersonAndOrganization()
  if (!user) {
    return <div>User not found</div>
  }

  const availablePersons = await getAvailablePersonsForSelfLinking()
  const [jiraCredentials, githubCredentials] = await Promise.all([
    getJiraCredentials(),
    getGithubCredentials(),
  ])

  return (
    <PageContainer>
      <PageHeader
        title='Settings'
        subtitle='Manage your account settings and integrations.'
        helpId='getting-started/accounts-organizations-subscriptions'
      />

      <PageContent>
        <div className='space-y-6 flex flex-wrap gap-lg'>
          {/* User Info */}
          <PageSection
            variant='bordered'
            header={<SectionHeader icon={User} title='User Info' />}
            className={cn('min-w-full md:min-w-[400px] flex-1')}
          >
            <UserInfoSection
              email={user.email || ''}
              userId={user.managerOSUserId}
              role={user.role || undefined}
            />
          </PageSection>

          {/* Person Linking Section */}
          <PageSection
            variant='bordered'
            header={<SectionHeader icon={User} title='Account Linking' />}
            className='min-w-full md:min-w-[400px] flex-1'
          >
            <PersonLinkForm
              currentUser={user}
              currentOrganization={organization}
              currentPerson={person}
              availablePersons={availablePersons}
            />
          </PageSection>

          {/* Preferences */}
          <PageSection
            variant='bordered'
            header={<SectionHeader icon={Sliders} title='Preferences' />}
            className={cn('min-w-full md:min-w-[400px] flex-1')}
          >
            <OnboardingPreferenceSection />
          </PageSection>

          {/* Integration Settings */}
          <PageSection
            variant='bordered'
            header={
              <SectionHeader icon={Settings} title='Integration Settings' />
            }
            className='min-w-full'
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
