'use client'

import { useState, useEffect } from 'react'
import {
  linkUserToPerson,
  unlinkUserFromPerson,
  getAvailableUsersForLinking,
} from '@/lib/actions'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface UserLinkFormProps {
  personId: string
  linkedUser?: User | null
  onLinkChange?: () => void
}

export function UserLinkForm({
  personId,
  linkedUser,
  onLinkChange,
}: UserLinkFormProps) {
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await getAvailableUsersForLinking()
        setAvailableUsers(users)
      } catch (error) {
        console.error('Error loading users:', error)
      }
    }
    loadUsers()
  }, [])

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return

    setIsLoading(true)
    setError('')

    try {
      await linkUserToPerson(selectedUserId, personId)
      setSelectedUserId('')
      if (onLinkChange) onLinkChange()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlink = async () => {
    if (!linkedUser) return

    setIsLoading(true)
    setError('')

    try {
      await unlinkUserFromPerson(linkedUser.id)
      if (onLinkChange) onLinkChange()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='space-y-4'>
      <div>
        <h4 className='font-medium mb-2'>User Account Link</h4>
        <p className='text-sm text-neutral-400 mb-4'>
          Link this person to a user account to enable login access.
        </p>
      </div>

      {error && (
        <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded'>
          {error}
        </div>
      )}

      {linkedUser ? (
        <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='font-medium text-green-800'>
                Linked to User Account
              </div>
              <div className='text-sm text-green-600'>
                {linkedUser.name} ({linkedUser.email}) - {linkedUser.role}
              </div>
            </div>
            <button
              onClick={handleUnlink}
              disabled={isLoading}
              className='btn bg-red-600 hover:bg-red-700 text-sm'
            >
              {isLoading ? 'Unlinking...' : 'Unlink'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleLink} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>
              Select User to Link
            </label>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className='input'
              required
            >
              <option value=''>Choose a user...</option>
              {availableUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) - {user.role}
                </option>
              ))}
            </select>
            {availableUsers.length === 0 && (
              <p className='text-sm text-neutral-500 mt-1'>
                No available users to link. All users in your organization are
                already linked to persons.
              </p>
            )}
          </div>

          <button
            type='submit'
            disabled={
              isLoading || !selectedUserId || availableUsers.length === 0
            }
            className='btn bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
          >
            {isLoading ? 'Linking...' : 'Link User Account'}
          </button>
        </form>
      )}
    </div>
  )
}
