'use client'

import { useState, useEffect } from 'react'
import { Users, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { shareNote, getUsersForSharing } from '@/lib/actions/notes'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { MultiSelect } from '@/components/ui/multi-select'

interface User {
  id: string
  name: string
  email: string
}

interface NoteSharingPanelProps {
  noteId: string
  sharedWith?: User[]
  sharedWithEveryone?: boolean
  isCreator: boolean
}

export function NoteSharingPanel({
  noteId,
  sharedWith = [],
  sharedWithEveryone: initialSharedWithEveryone = false,
  isCreator,
}: NoteSharingPanelProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [shareMode, setShareMode] = useState<'everyone' | 'specific'>(
    initialSharedWithEveryone ? 'everyone' : 'specific'
  )

  // Load users when dialog opens
  useEffect(() => {
    if (isOpen && users.length === 0) {
      loadUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Initialize selected users from sharedWith and share mode
  useEffect(() => {
    if (initialSharedWithEveryone) {
      setShareMode('everyone')
      setSelectedUserIds([])
    } else if (sharedWith && sharedWith.length > 0) {
      setShareMode('specific')
      setSelectedUserIds(sharedWith.map(u => u.id))
    } else {
      setShareMode('specific')
      setSelectedUserIds([])
    }
  }, [sharedWith, initialSharedWithEveryone])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const availableUsers = await getUsersForSharing()
      setUsers(availableUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to load users'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await shareNote({
        noteId,
        userIds: shareMode === 'everyone' ? [] : selectedUserIds,
        sharedWithEveryone: shareMode === 'everyone',
      })
      toast.success('Sharing settings updated')
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error sharing note:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to update sharing'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const userOptions = users.map(user => ({
    label: user.name,
    value: user.id,
  }))

  if (!isCreator) {
    // View-only mode for non-creators
    if (sharedWith.length === 0) {
      return null
    }

    return (
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Users className='h-4 w-4' />
        <span>
          Shared with {sharedWith.length} user
          {sharedWith.length !== 1 ? 's' : ''}
        </span>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' className='flex items-center gap-2'>
          <Users className='h-4 w-4' />
          Share
          {sharedWith.length > 0 && (
            <Badge variant='secondary' className='ml-1'>
              {sharedWith.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Note</DialogTitle>
          <DialogDescription>
            Select users to share this note with. They will be able to view and
            edit the note.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          ) : (
            <>
              <div className='space-y-4'>
                <RadioGroup
                  value={shareMode}
                  onValueChange={value => {
                    setShareMode(value as 'everyone' | 'specific')
                    if (value === 'everyone') {
                      setSelectedUserIds([])
                    }
                  }}
                  className='space-y-3'
                >
                  <div className='flex items-center space-x-2 p-3 border rounded-lg bg-muted/50'>
                    <RadioGroupItem value='everyone' id='share-everyone' />
                    <Label
                      htmlFor='share-everyone'
                      className='text-sm font-medium cursor-pointer flex-1'
                    >
                      Share with Everyone in Organization
                    </Label>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex items-center space-x-2 p-3 border rounded-lg'>
                      <RadioGroupItem value='specific' id='share-specific' />
                      <Label
                        htmlFor='share-specific'
                        className='text-sm font-medium cursor-pointer flex-1'
                      >
                        Choose Who to Share With
                      </Label>
                    </div>
                    {shareMode === 'specific' && (
                      <div className='ml-8'>
                        <MultiSelect
                          options={userOptions}
                          selected={selectedUserIds}
                          onChange={setSelectedUserIds}
                          placeholder='Select users to share with...'
                          maxDisplay={3}
                        />
                      </div>
                    )}
                  </div>
                </RadioGroup>
              </div>

              {shareMode === 'specific' && selectedUserIds.length > 0 && (
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Selected users</label>
                  <div className='flex flex-wrap gap-2'>
                    {selectedUserIds.map(userId => {
                      const user = users.find(u => u.id === userId)
                      if (!user) return null
                      return (
                        <Badge
                          key={userId}
                          variant='secondary'
                          className='flex items-center gap-2 px-2 py-1'
                        >
                          <Avatar className='h-4 w-4'>
                            <AvatarFallback className='text-xs'>
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className='text-xs'>{user.name}</span>
                          <button
                            onClick={() =>
                              setSelectedUserIds(prev =>
                                prev.filter(id => id !== userId)
                              )
                            }
                            className='ml-1 hover:bg-muted rounded-full p-0.5'
                          >
                            <X className='h-3 w-3' />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}

              {sharedWith.length > 0 && (
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    Currently shared with
                  </label>
                  <div className='flex flex-wrap gap-2'>
                    {sharedWith.map(user => (
                      <Badge
                        key={user.id}
                        variant='outline'
                        className='flex items-center gap-2 px-2 py-1'
                      >
                        <Avatar className='h-4 w-4'>
                          <AvatarFallback className='text-xs'>
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className='text-xs'>{user.name}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
