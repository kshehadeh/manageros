'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  linkUserToPerson,
  unlinkUserFromPerson,
  getAvailableUsersForLinking,
} from '@/lib/actions/organization'

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
  }, [personId])

  const handleLink = async () => {
    if (!selectedUserId) return

    setIsLoading(true)

    try {
      await linkUserToPerson(selectedUserId, personId)
      setSelectedUserId('')
      toast.success('User account linked successfully')
      if (onLinkChange) onLinkChange()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'

      // Provide more user-friendly error messages
      if (errorMessage.includes('Only organization admins')) {
        toast.error(
          'Only organization administrators can link users to persons.'
        )
      } else if (errorMessage.includes('Person not found')) {
        toast.error(
          'Person not found or you do not have permission to link this account.'
        )
      } else if (errorMessage.includes('already linked')) {
        toast.error('This person is already linked to a user account.')
      } else if (errorMessage.includes('organization')) {
        toast.error('You must belong to an organization to link user accounts.')
      } else {
        toast.error(`Failed to link user account: ${errorMessage}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlink = async () => {
    if (!linkedUser) return

    setIsLoading(true)

    try {
      await unlinkUserFromPerson(linkedUser.id)
      toast.success('User account unlinked successfully')
      if (onLinkChange) onLinkChange()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'

      // Provide more user-friendly error messages
      if (errorMessage.includes('Only organization admins')) {
        toast.error(
          'Only organization administrators can unlink users from persons.'
        )
      } else if (errorMessage.includes('Person not found')) {
        toast.error(
          'Person not found or you do not have permission to unlink this account.'
        )
      } else if (errorMessage.includes('organization')) {
        toast.error(
          'You must belong to an organization to unlink user accounts.'
        )
      } else {
        toast.error(`Failed to unlink user account: ${errorMessage}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='space-y-4'>
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
        <div className='space-y-4'>
          <div>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className='input'
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
            onClick={handleLink}
            disabled={
              isLoading || !selectedUserId || availableUsers.length === 0
            }
            variant='outline'
          >
            {isLoading ? 'Linking...' : 'Link User Account'}
          </Button>
        </div>
      )}
    </div>
  )
}
