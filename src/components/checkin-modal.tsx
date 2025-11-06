'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { CheckInFormContent } from './checkin-form-content'

export interface CheckInFormDataProps {
  initiativeId: string
  initiativeTitle: string
  checkIn?: {
    id: string
    weekOf: string
    rag: string
    confidence: number
    summary: string
    blockers?: string | null
    nextSteps?: string | null
  }
  onSuccess?: () => void
}

interface CheckInModalProps extends CheckInFormDataProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CheckInModal({
  initiativeId,
  initiativeTitle,
  checkIn,
  open,
  onOpenChange,
  onSuccess,
}: CheckInModalProps) {
  const isEditing = !!checkIn

  const handleSuccess = () => {
    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Check-in' : 'New Check-in'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update the check-in for ${initiativeTitle}`
              : `Add a progress update for ${initiativeTitle}`}
          </DialogDescription>
        </DialogHeader>

        <CheckInFormContent
          initiativeId={initiativeId}
          initiativeTitle={initiativeTitle}
          checkIn={checkIn}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
