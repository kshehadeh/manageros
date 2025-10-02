'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { User as UserIcon, Link, Unlink } from 'lucide-react'
import { User } from 'next-auth'
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
  const [availablePersons, setAvailablePersons] = useState<Person[]>([])
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [userData, setUserData] = useState<{
    user: User
    person: Person | null
  } | null>(null)

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

  const handleLink = async () => {
    if (!selectedPersonId) return

    setIsLoading(true)
    setError('')

    try {
      await linkSelfToPerson(selectedPersonId)
      // Refresh the component data
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

  const handleUnlink = async () => {
    setIsLoading(true)
    setError('')

    try {
      await unlinkSelfFromPerson()
      // Refresh the component data
      const [availablePersonsData, userWithPerson] = await Promise.all([
        getAvailablePersonsForSelfLinking(),
        getCurrentUserWithPerson(),
      ])
      setAvailablePersons(availablePersonsData)
      setUserData(userWithPerson)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!userData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <UserIcon className='h-5 w-5' />
            Account Linking
          </CardTitle>
          <CardDescription>
            Link your account to a person in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-center py-4'>
            <p className='text-sm text-muted-foreground'>Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { person } = userData

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <UserIcon className='h-5 w-5' />
          Account Linking
        </CardTitle>
        <CardDescription>
          Link your account to a person in your organization to access features
          like one-on-ones, reports, and personal data
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {error && (
          <div className='p-3 text-sm text-destructive-foreground bg-destructive rounded-md'>
            {error}
          </div>
        )}

        {person ? (
          <div className='space-y-4'>
            <div className='p-4 bg-card border border-border rounded-lg'>
              <div className='flex items-center gap-2 mb-2'>
                <Link className='h-4 w-4 text-success' />
                <span className='font-medium'>Currently Linked</span>
                <Badge variant='success'>Active</Badge>
              </div>
              <div className='space-y-2 text-sm'>
                <p>
                  <strong>Name:</strong> {person.name}
                </p>
                {person.email && (
                  <p>
                    <strong>Email:</strong> {person.email}
                  </p>
                )}
                {person.role && (
                  <p>
                    <strong>Role:</strong> {person.role}
                  </p>
                )}
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='outline' disabled={isLoading}>
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
        ) : (
          <div className='space-y-4'>
            {availablePersons.length > 0 ? (
              <>
                <div className='space-y-2'>
                  <label
                    htmlFor='person-select'
                    className='text-sm font-medium'
                  >
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

                <Button
                  onClick={handleLink}
                  disabled={isLoading || !selectedPersonId}
                  className='w-full'
                >
                  <Link className='h-4 w-4' />
                  {isLoading ? 'Linking...' : 'Link Account'}
                </Button>
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
      </CardContent>
    </Card>
  )
}
