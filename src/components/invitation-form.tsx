'use client'

import { useState } from 'react'
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
    <div className='bg-white shadow rounded-lg p-6'>
      <h3 className='text-lg font-medium text-gray-900 mb-4'>
        Invite User to Organization
      </h3>

      {error && (
        <div className='mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded'>
          {error}
        </div>
      )}

      {success && (
        <div className='mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded'>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label
            htmlFor='email'
            className='block text-sm font-medium text-gray-700'
          >
            Email Address
          </label>
          <input
            type='email'
            id='email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
            placeholder='user@example.com'
          />
          <p className='mt-1 text-sm text-gray-500'>
            The user will receive an invitation to join your organization. They
            can accept it when they create their account.
          </p>
        </div>

        <div>
          <button
            type='submit'
            disabled={isLoading}
            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
          >
            {isLoading ? 'Sending Invitation...' : 'Send Invitation'}
          </button>
        </div>
      </form>
    </div>
  )
}
