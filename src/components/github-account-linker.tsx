'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { toast } from 'sonner'
import { Link as LinkIcon } from 'lucide-react'
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

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await linkPersonToGithubAccount(personId, githubUsername)
      toast.success('GitHub account linked successfully')
      onSuccess?.()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to link GitHub account'

      // Provide more user-friendly error messages
      if (errorMessage.includes('credentials not configured')) {
        toast.error(
          'GitHub integration is not configured. Please set up GitHub credentials in Settings first.'
        )
      } else if (errorMessage.includes('No GitHub user found')) {
        toast.error(
          `No GitHub user found with username "${githubUsername}". Please check the username and try again.`
        )
      } else if (errorMessage.includes('Person not found')) {
        toast.error(
          'Person not found or you do not have permission to link this account.'
        )
      } else if (errorMessage.includes('organization')) {
        toast.error(
          'You must belong to an organization to link GitHub accounts.'
        )
      } else {
        toast.error(`Failed to link GitHub account: ${errorMessage}`)
      }
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

    try {
      await unlinkPersonFromGithubAccount(personId)
      toast.success('GitHub account unlinked successfully')
      onSuccess?.()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to unlink GitHub account'

      // Provide more user-friendly error messages
      if (errorMessage.includes('Person not found')) {
        toast.error(
          'Person not found or you do not have permission to unlink this account.'
        )
      } else if (errorMessage.includes('organization')) {
        toast.error(
          'You must belong to an organization to unlink GitHub accounts.'
        )
      } else {
        toast.error(`Failed to unlink GitHub account: ${errorMessage}`)
      }
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
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <form onSubmit={handleLink} className='space-y-3'>
        <div className='flex items-center gap-2'>
          <Input
            type='text'
            value={githubUsername}
            onChange={e => setGithubUsername(e.target.value)}
            placeholder='github-username'
            className='flex-1'
            required
          />
          <Button
            type='submit'
            disabled={isLoading || !githubUsername.trim()}
            variant='outline'
            size='icon'
            title='Link Account'
          >
            {isLoading ? (
              <span className='text-sm'>...</span>
            ) : (
              <LinkIcon className='h-4 w-4' />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
