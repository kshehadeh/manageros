'use client'

import { useState } from 'react'
import { saveJiraCredentials, deleteJiraCredentials } from '@/lib/actions'

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
        <h3 className='text-lg font-medium text-white'>Jira Integration</h3>
        <p className='text-sm text-neutral-400'>
          Configure your Jira credentials to enable work activity tracking for
          your team members.
        </p>
      </div>

      {initialCredentials && (
        <div className='rounded-md bg-green-900/20 border border-green-800 p-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <svg
                className='h-5 w-5 text-green-400'
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
              <h4 className='text-sm font-medium text-green-400'>
                Jira credentials configured
              </h4>
              <div className='mt-1 text-sm text-green-300'>
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
            className='block text-sm font-medium text-white'
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
          <p className='mt-1 text-xs text-neutral-500'>
            The base URL of your Jira instance (e.g.,
            https://yourcompany.atlassian.net)
          </p>
        </div>

        <div>
          <label
            htmlFor='jiraUsername'
            className='block text-sm font-medium text-white'
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
          <p className='mt-1 text-xs text-neutral-500'>
            Your Jira username or email address
          </p>
        </div>

        <div>
          <label
            htmlFor='jiraApiKey'
            className='block text-sm font-medium text-white'
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
          <p className='mt-1 text-xs text-neutral-500'>
            Generate an API token from your Jira account settings
          </p>
        </div>

        {error && (
          <div className='rounded-md bg-red-900/20 border border-red-800 p-4'>
            <div className='text-sm text-red-400'>{error}</div>
          </div>
        )}

        <div className='flex justify-end space-x-3'>
          {onCancel && (
            <button
              type='button'
              onClick={onCancel}
              className='rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-700'
            >
              Cancel
            </button>
          )}
          <button type='submit' disabled={isLoading} className='btn'>
            {isLoading ? 'Saving...' : 'Save Credentials'}
          </button>
        </div>
      </form>

      <div className='border-t border-neutral-800 pt-4'>
        <button
          type='button'
          onClick={handleDelete}
          disabled={isLoading}
          className='text-sm text-red-400 hover:text-red-300 disabled:opacity-50'
        >
          Delete Jira Credentials
        </button>
      </div>
    </div>
  )
}
