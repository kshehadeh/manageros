'use client'

import { useState } from 'react'
import { saveGithubCredentials, deleteGithubCredentials } from '@/lib/actions'
import { Button } from './ui/button'

interface GithubCredentialsFormProps {
  initialCredentials?: {
    githubUsername: string
  } | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function GithubCredentialsForm({
  initialCredentials,
  onSuccess,
  onCancel,
}: GithubCredentialsFormProps) {
  const [formData, setFormData] = useState({
    githubUsername: initialCredentials?.githubUsername || '',
    githubPat: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await saveGithubCredentials(formData)
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save GitHub credentials'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your GitHub credentials?')) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await deleteGithubCredentials()
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete GitHub credentials'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium text-foreground'>
          GitHub Integration
        </h3>
        <p className='text-sm text-muted-foreground'>
          Configure your GitHub Personal Access Token to enable GitHub account
          linking for your team members.
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
                GitHub credentials configured
              </h4>
              <div className='mt-1 text-sm text-foreground'>
                <p>Username: {initialCredentials.githubUsername}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label
            htmlFor='githubUsername'
            className='block text-sm font-medium text-foreground'
          >
            GitHub Username
          </label>
          <input
            type='text'
            id='githubUsername'
            value={formData.githubUsername}
            onChange={e =>
              setFormData(prev => ({ ...prev, githubUsername: e.target.value }))
            }
            placeholder='your-github-username'
            className='input'
            required
          />
          <p className='mt-1 text-xs text-muted-foreground'>
            Your GitHub username
          </p>
        </div>

        <div>
          <label
            htmlFor='githubPat'
            className='block text-sm font-medium text-foreground'
          >
            Personal Access Token
          </label>
          <input
            type='password'
            id='githubPat'
            value={formData.githubPat}
            onChange={e =>
              setFormData(prev => ({ ...prev, githubPat: e.target.value }))
            }
            placeholder='Enter your GitHub Personal Access Token'
            className='input'
            required
          />
          <p className='mt-1 text-xs text-muted-foreground'>
            Generate a Personal Access Token from your GitHub account settings
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
          Delete GitHub Credentials
        </Button>
      </div>
    </div>
  )
}
