import { getJiraCredentials } from '@/lib/actions'
import { JiraCredentialsForm } from '@/components/jira-credentials-form'

export default async function SettingsPage() {
  const jiraCredentials = await getJiraCredentials()

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-white'>Settings</h1>
        <p className='text-neutral-400'>
          Manage your account settings and integrations.
        </p>
      </div>

      <div className='space-y-8'>
        <div className='card'>
          <JiraCredentialsForm initialCredentials={jiraCredentials} />
        </div>
      </div>
    </div>
  )
}
