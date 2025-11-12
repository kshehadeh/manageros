'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Link, Unlink } from 'lucide-react'
import { PersonListItem } from '@/components/people/person-list-item'
import type { User } from '@/lib/auth-types'
import {
  linkSelfToPerson,
  unlinkSelfFromPerson,
  getAvailablePersonsForSelfLinking,
  getCurrentUserWithPerson,
} from '@/lib/actions/organization'

interface Person {
  id: string
  name: string
  email: string | null
  role: string | null
  status: string
}

interface PersonLinkFormProps {
  refreshTrigger?: number
}

export function PersonLinkForm({ refreshTrigger }: PersonLinkFormProps) {
  const router = useRouter()
  const [availablePersons, setAvailablePersons] = useState<Person[]>([])
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [userData, setUserData] = useState<{
    user: User
    person: Person | null
  } | null>(null)

  const handleLink = useCallback(async () => {
    if (!selectedPersonId) return

    setIsLoading(true)
    setError('')

    try {
      await linkSelfToPerson(selectedPersonId)
      // Refresh the router to invalidate any cached data
      router.refresh()
      // Refresh the component data - getCurrentUserWithPerson now queries DB directly
      const [availablePersonsData, userWithPerson] = await Promise.all([
        getAvailablePersonsForSelfLinking(),
        getCurrentUserWithPerson(),
      ])
      setAvailablePersons(availablePersonsData)
      setUserData(userWithPerson)
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError('')

        const [availablePersonsData, userWithPerson] = await Promise.all([
          getAvailablePersonsForSelfLinking(),
          getCurrentUserWithPerson(),
        ])

        setAvailablePersons(availablePersonsData)
        setUserData(userWithPerson)
        setSelectedPersonId('')
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [refreshTrigger])

  const handleUnlink = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      await unlinkSelfFromPerson()
      // Refresh the router to invalidate any cached data
      router.refresh()
      // Refresh the component data - getCurrentUserWithPerson now queries DB directly
      const [availablePersonsData, userWithPerson] = await Promise.all([
        getAvailablePersonsForSelfLinking(),
        getCurrentUserWithPerson(),
      ])
      setAvailablePersons(availablePersonsData)
      setUserData(userWithPerson)
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

  if (!userData) {
    return (
      <div className='text-center py-4'>
        <p className='text-sm text-muted-foreground'>Loading...</p>
      </div>
    )
  }

  const { person } = userData

  return (
    <div className='space-y-4'>
      <p className='text-sm text-muted-foreground'>
        Link your account to a person in your organization to access features
        like one-on-ones, reports, and personal data
      </p>
      {error && (
        <div className='p-3 text-sm text-destructive-foreground bg-destructive rounded-md'>
          {error}
        </div>
      )}

      {person ? (
        <div className='space-y-4'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-2'>
              <Link className='h-4 w-4 text-success' />
              <span className='font-medium'>Currently Linked</span>
              <Badge variant='success'>Active</Badge>
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
                    <strong>{person.name}</strong>? This will remove access to
                    personal features until you link to another person.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleUnlink}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Unlinking...' : 'Unlink Account'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <PersonListItem
            person={{
              id: person.id,
              name: person.name,
              email: person.email,
              role: person.role,
            }}
            showRole={true}
            showEmail={true}
          />
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
