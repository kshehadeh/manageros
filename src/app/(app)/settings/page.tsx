import { getJiraCredentials } from '@/lib/actions/jira'
import { getGithubCredentials } from '@/lib/actions/github'
import {
  getAvailablePersonsForSelfLinking,
  getPendingInvitationsForUser,
} from '@/lib/actions/organization'
import { JiraCredentialsSection } from '@/components/settings/jira-credentials-section'
import { GithubCredentialsSection } from '@/components/settings/github-credentials-section'
import { UserInfoSection } from '@/components/settings/user-info-section'
import { OrganizationSection } from '@/components/settings/organization-section'
import { PersonLinkForm } from '@/components/people/person-link-form'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { User, Settings, Shield, Building } from 'lucide-react'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { getCurrentUserWithPersonAndOrganization } from '../../../lib/auth-utils'

export default async function SettingsPage() {
  const { user, person, organization } =
    await getCurrentUserWithPersonAndOrganization()
  if (!user) {
    return <div>User not found</div>
  }

  const availablePersons = await getAvailablePersonsForSelfLinking()
  const [jiraCredentials, githubCredentials, pendingInvitations] =
    await Promise.all([
      getJiraCredentials(),
      getGithubCredentials(),
      getPendingInvitationsForUser(user.clerkUserId || null),
    ])

  return (
    <PageContainer>
      <PageHeader
        title='Settings'
        subtitle='Manage your account settings and integrations.'
        helpId='accounts-organizations-subscriptions'
      />

      <PageContent>
        <div className='space-y-6'>
          {/* User Info and Organization - Side by side on larger screens */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* User Info */}
            <PageSection
              variant='bordered'
              header={<SectionHeader icon={User} title='User Info' />}
            >
              <UserInfoSection
                email={user.email || ''}
                userId={user.managerOSUserId}
                role={user.role || undefined}
              />
            </PageSection>

            {/* Organization Section */}
            <PageSection
              variant='bordered'
              header={<SectionHeader icon={Building} title='Organization' />}
            >
              <OrganizationSection
                organizationId={organization?.id || null}
                organizationName={organization?.name || null}
                pendingInvitations={pendingInvitations}
              />
            </PageSection>
          </div>

          {/* Account Linking and Permissions - Side by side on larger screens */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Person Linking Section */}
            <PageSection
              variant='bordered'
              header={<SectionHeader icon={User} title='Account Linking' />}
            >
              <PersonLinkForm
                currentUser={user}
                currentOrganization={organization}
                currentPerson={person}
                availablePersons={availablePersons}
              />
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
