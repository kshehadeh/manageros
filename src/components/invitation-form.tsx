'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createOrganizationInvitation } from '@/lib/actions'

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
      <h3 className='text-lg font-medium text-neutral-100 mb-4'>
        Invite User to Organization
      </h3>

      {error && (
        <div className='mb-4 bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded'>
          {error}
        </div>
      )}

      {success && (
        <div className='mb-4 bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded'>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label
            htmlFor='email'
            className='block text-sm font-medium text-neutral-300'
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
          <p className='mt-1 text-sm text-neutral-500'>
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
