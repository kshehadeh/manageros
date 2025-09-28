'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
      {error && (
        <div className='bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded'>
          {error}
        </div>
      )}

      {linkedUser ? (
        <div className='bg-secondary/30 border rounded-lg p-4'>
          <div className='space-y-3'>
            <div>
              <div className='font-medium text-foreground'>
                {linkedUser.name}
              </div>
              <div className='text-sm text-muted-foreground'>
                {linkedUser.email}
              </div>
              <div className='text-sm text-muted-foreground'>
                {linkedUser.role}
              </div>
            </div>
            <Button
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
      ) : (
        <form onSubmit={handleLink} className='space-y-4'>
          <div>
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
          </div>

          <Button
            type='submit'
            disabled={
              isLoading || !selectedUserId || availableUsers.length === 0
            }
            variant='outline'
          >
            {isLoading ? 'Linking...' : 'Link User Account'}
          </Button>
        </form>
      )}
    </div>
  )
}
