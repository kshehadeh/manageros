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
  personName,
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
        <div>
          <h4 className='text-sm font-medium text-white'>Jira Account</h4>
          <p className='text-sm text-neutral-400'>
            Linked to Jira account:{' '}
            <span className='font-medium text-white'>
              {jiraAccount.jiraDisplayName}
            </span>
          </p>
          <p className='text-xs text-neutral-500'>{jiraAccount.jiraEmail}</p>
        </div>

        {error && (
          <div className='rounded-md bg-red-900/20 border border-red-800 p-3'>
            <div className='text-sm text-red-400'>{error}</div>
          </div>
        )}

        <Button
          type='button'
          onClick={handleUnlink}
          disabled={isLoading}
          variant='outline'
        >
          {isLoading ? 'Unlinking...' : 'Unlink Jira Account'}
        </Button>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div>
        <h4 className='text-sm font-medium text-white'>Link Jira Account</h4>
        <p className='text-sm text-neutral-400'>
          Link {personName} to their Jira account to enable work activity
          tracking.
        </p>
      </div>

      <form onSubmit={handleLink} className='space-y-3'>
        <div>
          <label
            htmlFor='jiraEmail'
            className='block text-sm font-medium text-white'
          >
            Jira Email Address
          </label>
          <input
            type='email'
            id='jiraEmail'
            value={jiraEmail}
            onChange={e => setJiraEmail(e.target.value)}
            placeholder='person@company.com'
            className='input'
            required
          />
          <p className='mt-1 text-xs text-neutral-500'>
            The email address associated with their Jira account
          </p>
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
