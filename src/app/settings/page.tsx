import { getJiraCredentials } from '@/lib/actions'
import { JiraCredentialsForm } from '@/components/jira-credentials-form'

export default async function SettingsPage() {
  const jiraCredentials = await getJiraCredentials()

  return (
    <div className='page-container'>
      <div className='page-header'>
        <h1 className='page-title'>Settings</h1>
        <p className='page-subtitle'>
          Manage your account settings and integrations.
        </p>
      </div>

      <div className='page-section'>
        <div className='card'>
          <JiraCredentialsForm initialCredentials={jiraCredentials} />
        </div>
      </div>
    </div>
  )
}
