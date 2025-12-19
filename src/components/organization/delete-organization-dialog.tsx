'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface DeleteOrganizationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  organizationName: string
  confirmationText?: string
}

export function DeleteOrganizationDialog({
  isOpen,
  onClose,
  onConfirm,
  organizationName,
  confirmationText = 'DELETE',
}: DeleteOrganizationDialogProps) {
  const [inputValue, setInputValue] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const isConfirmed = inputValue.trim() === confirmationText
  const canDelete = isConfirmed && !isDeleting

  const handleConfirm = async () => {
    if (!canDelete) return

    setIsDeleting(true)
    try {
      await onConfirm()
      onClose()
      setInputValue('')
    } catch (error) {
      console.error('Failed to delete organization:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete organization'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (isDeleting) return
    setInputValue('')
    onClose()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Organization</AlertDialogTitle>
          <AlertDialogDescription className='space-y-4'>
            <div>
              <p className='font-semibold text-destructive mb-2'>
                This action cannot be undone.
              </p>
              <p>
                This will permanently delete <strong>{organizationName}</strong>{' '}
                and all associated data, including:
              </p>
              <ul className='list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground'>
                <li>All people, teams, and organizational structure</li>
                <li>All initiatives, objectives, and tasks</li>
                <li>All meetings, feedback, and one-on-ones</li>
                <li>All notes, files, and integrations</li>
                <li>All user memberships and invitations</li>
              </ul>
            </div>
            <div className='space-y-2 pt-2'>
              <Label htmlFor='confirm-input'>
                Type <strong>{confirmationText}</strong> to confirm:
              </Label>
              <Input
                id='confirm-input'
                type='text'
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={confirmationText}
                disabled={isDeleting}
                className='font-mono'
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && canDelete) {
                    handleConfirm()
                  }
                }}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canDelete}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isDeleting ? 'Deleting...' : 'Delete Organization'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
