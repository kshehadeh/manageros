'use client'

import { useState } from 'react'
import { saveJiraCredentials, deleteJiraCredentials } from '@/lib/actions'
import { Button } from './ui/button'

interface JiraCredentialsFormProps {
  initialCredentials?: {
    jiraUsername: string
    jiraBaseUrl: string
  } | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function JiraCredentialsForm({
  initialCredentials,
  onSuccess,
  onCancel,
}: JiraCredentialsFormProps) {
  const [formData, setFormData] = useState({
    jiraUsername: initialCredentials?.jiraUsername || '',
    jiraApiKey: '',
    jiraBaseUrl: initialCredentials?.jiraBaseUrl || '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await saveJiraCredentials(formData)
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save Jira credentials'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your Jira credentials?')) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await deleteJiraCredentials()
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete Jira credentials'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium text-foreground'>Jira Integration</h3>
        <p className='text-sm text-muted-foreground'>
          Configure your Jira credentials to enable work activity tracking for
          your team members.
        </p>
      </div>

      {initialCredentials && (
        <div className='rounded-md bg-secondary/30 border p-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <svg
                className='h-5 w-5 text-emerald-400'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
            <div className='ml-3'>
              <h4 className='text-sm font-medium text-foreground'>
                Jira credentials configured
              </h4>
              <div className='mt-1 text-sm text-foreground'>
                <p>Connected to: {initialCredentials.jiraBaseUrl}</p>
                <p>Username: {initialCredentials.jiraUsername}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label
            htmlFor='jiraBaseUrl'
            className='block text-sm font-medium text-foreground'
          >
            Jira Base URL
          </label>
          <input
            type='url'
            id='jiraBaseUrl'
            value={formData.jiraBaseUrl}
            onChange={e =>
              setFormData(prev => ({ ...prev, jiraBaseUrl: e.target.value }))
            }
            placeholder='https://yourcompany.atlassian.net'
            className='input'
            required
          />
          <p className='mt-1 text-xs text-muted-foreground'>
            The base URL of your Jira instance (e.g.,
            https://yourcompany.atlassian.net)
          </p>
        </div>

        <div>
          <label
            htmlFor='jiraUsername'
            className='block text-sm font-medium text-foreground'
          >
            Username or Email
          </label>
          <input
            type='text'
            id='jiraUsername'
            value={formData.jiraUsername}
            onChange={e =>
              setFormData(prev => ({ ...prev, jiraUsername: e.target.value }))
            }
            placeholder='your.email@company.com'
            className='input'
            required
          />
          <p className='mt-1 text-xs text-muted-foreground'>
            Your Jira username or email address
          </p>
        </div>

        <div>
          <label
            htmlFor='jiraApiKey'
            className='block text-sm font-medium text-foreground'
          >
            API Token
          </label>
          <input
            type='password'
            id='jiraApiKey'
            value={formData.jiraApiKey}
            onChange={e =>
              setFormData(prev => ({ ...prev, jiraApiKey: e.target.value }))
            }
            placeholder='Enter your Jira API token'
            className='input'
            required
          />
          <p className='mt-1 text-xs text-muted-foreground'>
            Generate an API token from your Jira account settings
          </p>
        </div>

        {error && (
          <div className='rounded-md bg-destructive/20 border border-destructive p-4'>
            <div className='text-sm text-destructive'>{error}</div>
          </div>
        )}

        <div className='flex justify-end space-x-3'>
          {onCancel && (
            <Button type='button' onClick={onCancel} variant='outline'>
              Cancel
            </Button>
          )}
          <Button type='submit' disabled={isLoading} variant='outline'>
            {isLoading ? 'Saving...' : 'Save Credentials'}
          </Button>
        </div>
      </form>

      <div className='border-t pt-4'>
        <Button
          type='button'
          onClick={handleDelete}
          disabled={isLoading}
          variant='outline'
        >
          Delete Jira Credentials
        </Button>
      </div>
    </div>
  )
}
