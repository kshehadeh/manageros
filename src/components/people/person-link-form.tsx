'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowDown, Link, Unlink } from 'lucide-react'
import { PersonListItem } from '@/components/people/person-list-item'
import type { OrganizationBrief, UserBrief } from '@/lib/auth-types'
import {
  linkSelfToPerson,
  unlinkSelfFromPerson,
} from '@/lib/actions/organization'
import { PersonBrief } from '@/types/person'

interface PersonLinkFormProps {
  availablePersons: PersonBrief[]
  currentUser: UserBrief
  currentOrganization?: OrganizationBrief | null
  currentPerson?: PersonBrief | null
}

export function PersonLinkForm({
  availablePersons,
  currentOrganization,
  currentPerson,
}: PersonLinkFormProps) {
  const router = useRouter()
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLink = useCallback(async () => {
    if (!selectedPersonId) return

    setIsLoading(true)
    setError('')

    try {
      await linkSelfToPerson(selectedPersonId)
      // Refresh the router to invalidate any cached data
      router.refresh()
      setSelectedPersonId('')
      // Dispatch event to notify other components (like sidebar) to refresh
      // Small delay to ensure database transaction is fully committed
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('user:personLinkChanged'))
      }, 150)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [selectedPersonId, router])

  const handleUnlink = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      await unlinkSelfFromPerson()
      // Refresh the router to invalidate any cached data
      router.refresh()
      // Dispatch event to notify other components (like sidebar) to refresh
      // Small delay to ensure database transaction is fully committed
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('user:personLinkChanged'))
      }, 150)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  // If user doesn't have an organization, show message
  if (!currentOrganization) {
    return (
      <div className='space-y-4'>
        <p className='text-sm text-muted-foreground'>
          You need to be a member of an organization before you can link your
          account to a person. Once you join or create an organization,
          you&apos;ll be able to link yourself to a person record.
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-sm'>
      {currentPerson ? (
        <p className='text-sm text-muted-foreground flex items-center gap-2'>
          You are currently linked to <strong>{currentPerson.name}</strong>{' '}
          <ArrowDown className='h-4 w-4' />
        </p>
      ) : (
        <p className='text-sm text-muted-foreground'>
          Link your account to a person in your organization to access features
          like one-on-ones, reports, and personal data
        </p>
      )}
      {error && (
        <div className='p-3 text-sm text-destructive-foreground bg-destructive rounded-md'>
          {error}
        </div>
      )}

      {currentPerson ? (
        <div className='space-y-4'>
          <div className='flex flex-col items-start mb-2 gap-lg border rounded-sm p-2'>
            <PersonListItem
              person={{
                id: currentPerson.id,
                name: currentPerson.name,
                email: currentPerson.email,
                role: currentPerson.role,
              }}
              showRole={true}
              showEmail={true}
            />
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant='outline' size='sm' disabled={isLoading}>
                <Unlink className='h-4 w-4' />
                Unlink Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unlink Account</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to unlink your account from{' '}
                  <strong>{currentPerson.name}</strong>? This will remove access
                  to personal features until you link to another person.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleUnlink} disabled={isLoading}>
                  {isLoading ? 'Unlinking...' : 'Unlink Account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <div className='space-y-4'>
          {availablePersons.length > 0 ? (
            <>
              <div className='space-y-2'>
                <label htmlFor='person-select' className='text-sm font-medium'>
                  Choose a person to link to:
                </label>
                <Select
                  value={selectedPersonId}
                  onValueChange={setSelectedPersonId}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a person...' />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePersons.map(person => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                        {person.email && ` (${person.email})`}
                        {person.role && ` - ${person.role}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex justify-end'>
                <Button
                  onClick={handleLink}
                  disabled={isLoading || !selectedPersonId}
                  size='sm'
                >
                  <Link className='h-4 w-4' />
                  {isLoading ? 'Linking...' : 'Link Account'}
                </Button>
              </div>
            </>
          ) : (
            <div className='text-center py-4'>
              <p className='text-sm text-muted-foreground'>
                No unlinked persons available in your organization.
              </p>
              <p className='text-xs text-muted-foreground mt-1'>
                All persons may already be linked to user accounts.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
