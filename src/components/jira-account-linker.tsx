'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  linkPersonToJiraAccount,
  unlinkPersonFromJiraAccount,
} from '@/lib/actions/jira'

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

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await linkPersonToJiraAccount(personId, jiraEmail)
      toast.success('Jira account linked successfully')
      onSuccess?.()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to link Jira account'

      // Provide more user-friendly error messages
      if (errorMessage.includes('credentials not configured')) {
        toast.error(
          'Jira integration is not configured. Please set up Jira credentials in Settings first.'
        )
      } else if (errorMessage.includes('No active Jira user found')) {
        toast.error(
          `No Jira user found with email "${jiraEmail}". Please check the email address and try again.`
        )
      } else if (errorMessage.includes('Multiple Jira users found')) {
        toast.error(
          `Multiple Jira users found with email "${jiraEmail}". Please contact your administrator.`
        )
      } else if (errorMessage.includes('Person not found')) {
        toast.error(
          'Person not found or you do not have permission to link this account.'
        )
      } else if (errorMessage.includes('organization')) {
        toast.error('You must belong to an organization to link Jira accounts.')
      } else {
        toast.error(`Failed to link Jira account: ${errorMessage}`)
      }
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

    try {
      await unlinkPersonFromJiraAccount(personId)
      toast.success('Jira account unlinked successfully')
      onSuccess?.()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to unlink Jira account'

      // Provide more user-friendly error messages
      if (errorMessage.includes('Person not found')) {
        toast.error(
          'Person not found or you do not have permission to unlink this account.'
        )
      } else if (errorMessage.includes('organization')) {
        toast.error(
          'You must belong to an organization to unlink Jira accounts.'
        )
      } else {
        toast.error(`Failed to unlink Jira account: ${errorMessage}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (jiraAccount) {
    return (
      <div className='space-y-4'>
        <div className='bg-secondary/30 border rounded-lg p-4'>
          <div className='space-y-3'>
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
              className='w-full'
            >
              {isLoading ? 'Unlinking...' : 'Unlink'}
            </Button>
          </div>
        </div>
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

        <Button type='submit' disabled={isLoading}>
          {isLoading ? 'Linking...' : 'Link Account'}
        </Button>
      </form>
    </div>
  )
}
