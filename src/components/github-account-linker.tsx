'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import {
  linkPersonToGithubAccount,
  unlinkPersonFromGithubAccount,
} from '@/lib/actions/github'

interface GithubAccountLinkerProps {
  personId: string
  personName: string
  githubAccount?: {
    githubUsername: string
    githubDisplayName: string | null
    githubEmail: string | null
  } | null
  onSuccess?: () => void
}

export function GithubAccountLinker({
  personId,
  personName: _personName,
  githubAccount,
  onSuccess,
}: GithubAccountLinkerProps) {
  const [githubUsername, setGithubUsername] = useState(
    githubAccount?.githubUsername || ''
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await linkPersonToGithubAccount(personId, githubUsername)
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to link GitHub account'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlink = async () => {
    if (
      !confirm(
        'Are you sure you want to unlink this person from their GitHub account?'
      )
    ) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await unlinkPersonFromGithubAccount(personId)
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to unlink GitHub account'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (githubAccount) {
    return (
      <div className='space-y-4'>
        <div className='bg-secondary/30 border rounded-lg p-4'>
          <div className='space-y-3'>
            <div>
              <div className='font-medium text-foreground'>
                {githubAccount.githubDisplayName ||
                  githubAccount.githubUsername}
              </div>
              <div className='text-sm text-muted-foreground'>
                @{githubAccount.githubUsername}
              </div>
              {githubAccount.githubEmail && (
                <div className='text-sm text-muted-foreground'>
                  {githubAccount.githubEmail}
                </div>
              )}
            </div>
            <Button
              type='button'
              onClick={handleUnlink}
              disabled={isLoading}
              variant='outline'
              size='sm'
              className='w-full'
            >
              {isLoading ? 'Unlinking...' : 'Unlink'}
            </Button>
          </div>
        </div>

        {error && (
          <div className='rounded-md bg-red-900/20 border border-red-800 p-3'>
            <div className='text-sm text-red-400'>{error}</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <form onSubmit={handleLink} className='space-y-3'>
        <div>
          <input
            type='text'
            value={githubUsername}
            onChange={e => setGithubUsername(e.target.value)}
            placeholder='github-username'
            className='input'
            required
          />
        </div>

        {error && (
          <div className='rounded-md bg-red-900/20 border border-red-800 p-3'>
            <div className='text-sm text-red-400'>{error}</div>
          </div>
        )}

        <Button type='submit' disabled={isLoading} variant='outline'>
          {isLoading ? 'Linking...' : 'Link Account'}
        </Button>
      </form>
    </div>
  )
}
