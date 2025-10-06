'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createOrganizationInvitation } from '@/lib/actions/organization'

interface InvitationFormProps {
  onInvitationSent?: () => void
}

export default function InvitationForm({
  onInvitationSent,
}: InvitationFormProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      await createOrganizationInvitation(email)
      setSuccess(`Invitation sent to ${email}`)
      setEmail('')
      onInvitationSent?.()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to send invitation'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='card'>
      <h3 className='text-lg font-medium text-foreground mb-4'>
        Invite User to Organization
      </h3>

      {error && (
        <div className='mb-4 bg-destructive/20 border border-destructive text-destructive px-4 py-3 rounded'>
          {error}
        </div>
      )}

      {success && (
        <div className='mb-4 bg-secondary/30 border text-foreground px-4 py-3 rounded'>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label
            htmlFor='email'
            className='block text-sm font-medium text-muted-foreground'
          >
            Email Address
          </label>
          <input
            type='email'
            id='email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className='input mt-1'
            placeholder='user@example.com'
          />
          <p className='mt-1 text-sm text-muted-foreground'>
            The user will receive an invitation to join your organization. They
            can accept it when they create their account.
          </p>
        </div>

        <div>
          <Button type='submit' disabled={isLoading} variant='outline' className='w-full justify-center'>
            {isLoading ? 'Sending Invitation...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </div>
  )
}
