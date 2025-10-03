'use client'

import { Button } from '@/components/ui/button'
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
      onClose()
    } catch (error) {
      console.error(`Failed to delete ${entityName}:`, error)
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to delete ${entityName}`
      )
    }
  }

  const finalTitle = title || `Delete ${entityName}`
  const finalDescription =
    description ||
    `Are you sure you want to delete this ${entityName}? This action cannot be undone.`

  if (!isOpen) return null

  return (
    <>
      {/* Modal Backdrop */}
      <div className='fixed inset-0 z-50 bg-black/50' onClick={onClose} />

      {/* Modal Content */}
      <div className='fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-popover rounded-lg border p-6 shadow-lg min-w-[320px]'>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <h3 className='text-lg font-semibold'>{finalTitle}</h3>
            <p className='text-sm text-muted-foreground'>{finalDescription}</p>
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={onClose}
              variant='outline'
              size='sm'
              className='flex-1'
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant='destructive'
              size='sm'
              className='flex-1'
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
