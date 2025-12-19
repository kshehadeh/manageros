'use client'

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
import { toast } from 'sonner'

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title?: string
  description?: string
  entityName?: string
  isLoading?: boolean
}

export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  entityName = 'item',
  isLoading = false,
}: DeleteModalProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm()
      // Don't close here - let the onConfirm handler close it after success
    } catch (error) {
      // Show error toast - the onConfirm handler should also show one, but this is a fallback
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to delete ${entityName}`
      )
      // Don't close modal on error - let user see the error and try again or cancel
    }
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  const finalTitle = title || `Delete ${entityName}`
  const finalDescription =
    description ||
    `Are you sure you want to delete this ${entityName}? This action cannot be undone.`

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{finalTitle}</AlertDialogTitle>
          <AlertDialogDescription>{finalDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
