'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PersonListItem } from '@/components/people/person-list-item'
import { Edit2, Users, X } from 'lucide-react'
import {
  addInitiativeOwner,
  removeInitiativeOwner,
} from '@/lib/actions/initiative'
import { toast } from 'sonner'

interface Person {
  id: string
  name: string
  email?: string | null
  avatar?: string | null
}

interface InitiativeOwner {
  initiativeId: string
  personId: string
  role: string
  person: Person
}

interface ManageOwnersModalProps {
  initiativeId: string
  owners: InitiativeOwner[]
  people: Person[]
}

export function ManageOwnersModal({
  initiativeId,
  owners,
  people,
}: ManageOwnersModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [selectedRole, setSelectedRole] = useState('owner')

  // Get people who are not already owners
  const availablePeople = people.filter(
    person => !owners.some(owner => owner.personId === person.id)
  )

  const handleAddOwner = async () => {
    if (!selectedPersonId) return

    setIsLoading(true)
    try {
      await addInitiativeOwner(initiativeId, selectedPersonId, selectedRole)
      toast.success('Owner added successfully')
      setSelectedPersonId('')
      setSelectedRole('owner')
    } catch (error) {
      console.error('Failed to add owner:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to add owner'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveOwner = async (personId: string) => {
    setIsLoading(true)
    try {
      await removeInitiativeOwner(initiativeId, personId)
      toast.success('Owner removed successfully')
    } catch (error) {
      console.error('Failed to remove owner:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove owner'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setSelectedPersonId('')
      setSelectedRole('owner')
    }
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          <Edit2 className='h-4 w-4 mr-2' />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className='md:max-w-[50vw] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Manage People
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Current Owners */}
          <div className='space-y-2'>
            <h4 className='text-sm font-medium'>Current People</h4>
            {owners.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                No people assigned yet.
              </p>
            ) : (
              <div className='space-y-2'>
                {owners.map(owner => (
                  <div
                    key={`${owner.initiativeId}-${owner.personId}`}
                    className='flex items-center justify-between p-2 border rounded-lg'
                  >
                    <PersonListItem
                      person={owner.person}
                      roleBadge={
                        owner.role && owner.role !== 'owner'
                          ? owner.role
                          : undefined
                      }
                    />
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleRemoveOwner(owner.personId)}
                      disabled={isLoading}
                      className='h-6 w-6 p-0 text-destructive hover:text-destructive'
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Owner */}
          {availablePeople.length > 0 && (
            <div className='space-y-3 border-t pt-4'>
              <h4 className='text-sm font-medium'>Add New Person</h4>
              <div className='grid grid-cols-2 gap-2'>
                <Select
                  value={selectedPersonId}
                  onValueChange={setSelectedPersonId}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select person' />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePeople.map(person => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='owner'>Owner</SelectItem>
                    <SelectItem value='sponsor'>Sponsor</SelectItem>
                    <SelectItem value='collaborator'>Collaborator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddOwner}
                disabled={isLoading || !selectedPersonId}
                className='w-full'
              >
                {isLoading ? 'Adding...' : 'Add Person'}
              </Button>
            </div>
          )}

          {availablePeople.length === 0 && owners.length > 0 && (
            <div className='text-center py-4 border-t'>
              <p className='text-sm text-muted-foreground'>
                All organization members are already associated with this
                initiative.
              </p>
            </div>
          )}
        </div>

        <div className='flex justify-end'>
          <Button
            variant='outline'
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
