import { getJiraCredentials, getGithubCredentials } from '@/lib/actions'
import { JiraCredentialsForm } from '@/components/jira-credentials-form'
import { GithubCredentialsForm } from '@/components/github-credentials-form'
import { PersonLinkForm } from '@/components/person-link-form'

export default async function SettingsPage() {
  const jiraCredentials = await getJiraCredentials()
  const githubCredentials = await getGithubCredentials()

  return (
    <div className='page-container'>
      <div className='page-header'>
        <h1 className='page-title'>Settings</h1>
        <p className='page-subtitle'>
          Manage your account settings and integrations.
        </p>
      </div>

      <div className='page-section space-y-6'>
        {/* Person Linking Section */}
        <PersonLinkForm />

        {/* Integration Settings */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='card'>
            <JiraCredentialsForm initialCredentials={jiraCredentials} />
          </div>

          <div className='card'>
            <GithubCredentialsForm initialCredentials={githubCredentials} />
          </div>
        </div>
      </div>
    </div>
  )
}
