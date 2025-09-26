'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import {
  linkPersonToJiraAccount,
  unlinkPersonFromJiraAccount,
} from '@/lib/actions'

interface JiraAccountLinkerProps {
  personId: string
  personName: string
  personEmail?: string | null
  jiraAccount?: {
    jiraEmail: string
    jiraDisplayName: string | null
  } | null
  onSuccess?: () => void
}

export function JiraAccountLinker({
  personId,
  personName: _personName,
  personEmail,
  jiraAccount,
  onSuccess,
}: JiraAccountLinkerProps) {
  const [jiraEmail, setJiraEmail] = useState(
    jiraAccount?.jiraEmail || personEmail || ''
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await linkPersonToJiraAccount(personId, jiraEmail)
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to link Jira account'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlink = async () => {
    if (
      !confirm(
        'Are you sure you want to unlink this person from their Jira account?'
      )
    ) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await unlinkPersonFromJiraAccount(personId)
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to unlink Jira account'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (jiraAccount) {
    return (
      <div className='space-y-4'>
        <div className='bg-secondary/30 border rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='font-medium text-foreground'>
                {jiraAccount.jiraDisplayName}
              </div>
              <div className='text-sm text-muted-foreground'>
                {jiraAccount.jiraEmail}
              </div>
            </div>
            <Button
              type='button'
              onClick={handleUnlink}
              disabled={isLoading}
              variant='outline'
              size='sm'
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
            type='email'
            value={jiraEmail}
            onChange={e => setJiraEmail(e.target.value)}
            placeholder='person@company.com'
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
