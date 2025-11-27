/**
 * Form for integration-specific credentials
 */

'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { IntegrationType } from '@/lib/integrations/base-integration'

interface IntegrationCredentialsFormProps {
  type: IntegrationType
  credentials: Record<string, string>
  onChange: (credentials: Record<string, string>) => void
}

export function IntegrationCredentialsForm({
  type,
  credentials,
  onChange,
}: IntegrationCredentialsFormProps) {
  const updateCredential = (key: string, value: string) => {
    onChange({ ...credentials, [key]: value })
  }

  if (type === 'google_calendar') {
    return (
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='serviceAccountEmail'>Service Account Email</Label>
          <Input
            id='serviceAccountEmail'
            type='email'
            value={credentials.serviceAccountEmail || ''}
            onChange={e =>
              updateCredential('serviceAccountEmail', e.target.value)
            }
            placeholder='service-account@project.iam.gserviceaccount.com'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='encryptedPrivateKey'>Private Key (JSON)</Label>
          <Input
            id='encryptedPrivateKey'
            type='password'
            value={credentials.encryptedPrivateKey || ''}
            onChange={e =>
              updateCredential('encryptedPrivateKey', e.target.value)
            }
            placeholder='Paste your service account private key'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='calendarId'>Calendar ID (Optional)</Label>
          <Input
            id='calendarId'
            value={credentials.calendarId || ''}
            onChange={e => updateCredential('calendarId', e.target.value)}
            placeholder='primary'
          />
        </div>
      </div>
    )
  }

  if (type === 'microsoft_outlook') {
    return (
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='tenantId'>Tenant ID</Label>
          <Input
            id='tenantId'
            value={credentials.tenantId || ''}
            onChange={e => updateCredential('tenantId', e.target.value)}
            placeholder='your-tenant-id'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='clientId'>Client ID</Label>
          <Input
            id='clientId'
            value={credentials.clientId || ''}
            onChange={e => updateCredential('clientId', e.target.value)}
            placeholder='your-client-id'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='encryptedClientSecret'>Client Secret</Label>
          <Input
            id='encryptedClientSecret'
            type='password'
            value={credentials.encryptedClientSecret || ''}
            onChange={e =>
              updateCredential('encryptedClientSecret', e.target.value)
            }
            placeholder='your-client-secret'
          />
        </div>
      </div>
    )
  }

  if (type === 'jira') {
    return (
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='jiraUsername'>Jira Username or Email</Label>
          <Input
            id='jiraUsername'
            value={credentials.jiraUsername || ''}
            onChange={e => updateCredential('jiraUsername', e.target.value)}
            placeholder='your-email@example.com'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='jiraBaseUrl'>Jira Base URL</Label>
          <Input
            id='jiraBaseUrl'
            value={credentials.jiraBaseUrl || ''}
            onChange={e => updateCredential('jiraBaseUrl', e.target.value)}
            placeholder='https://yourcompany.atlassian.net'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='encryptedApiKey'>API Token</Label>
          <Input
            id='encryptedApiKey'
            type='password'
            value={credentials.encryptedApiKey || ''}
            onChange={e => updateCredential('encryptedApiKey', e.target.value)}
            placeholder='Your Jira API token'
          />
        </div>
      </div>
    )
  }

  if (type === 'github') {
    return (
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='githubUsername'>GitHub Username</Label>
          <Input
            id='githubUsername'
            value={credentials.githubUsername || ''}
            onChange={e => updateCredential('githubUsername', e.target.value)}
            placeholder='your-username'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='encryptedPat'>Personal Access Token</Label>
          <Input
            id='encryptedPat'
            type='password'
            value={credentials.encryptedPat || ''}
            onChange={e => updateCredential('encryptedPat', e.target.value)}
            placeholder='ghp_xxxxxxxxxxxxxxxxxxxx'
          />
        </div>
      </div>
    )
  }

  return null
}
