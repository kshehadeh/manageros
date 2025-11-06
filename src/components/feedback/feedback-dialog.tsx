'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { FeedbackForm } from '@/components/feedback/feedback-form'
import { Edit, Eye, Calendar, User, Lock } from 'lucide-react'
import { type Person } from '@prisma/client'
import { getKindLabel, getKindVariant } from '@/lib/utils/feedback'

type FeedbackWithRelations = {
  id: string
  kind: string
  isPrivate: boolean
  body: string
  createdAt: Date | string
  about: {
    id: string
    name: string
  }
  from: {
    id: string
    name: string
  }
  fromId?: string
}

interface FeedbackDialogProps {
  feedback: FeedbackWithRelations
  isOpen: boolean
  onClose: () => void
  canEdit: boolean
  onRefresh?: () => void
}

export function FeedbackDialog({
  feedback,
  isOpen,
  onClose,
  canEdit,
  onRefresh,
}: FeedbackDialogProps) {
  const [isEditing, setIsEditing] = useState(false)

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleEditSuccess = () => {
    setIsEditing(false)
    onRefresh?.()
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const person: Person = {
    id: feedback.about.id,
    name: feedback.about.name,
    email: null,
    role: null,
    status: 'ACTIVE',
    birthday: null,
    avatar: null,
    employeeType: null,
    organizationId: '', // This will be filled by the form
    teamId: null,
    managerId: null,
    jobRoleId: null,
    startedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] flex flex-col p-0'>
        <DialogHeader className='sticky top-0 z-0 bg-background border-b px-6 py-4 rounded-t-lg pr-12'>
          <DialogTitle className='flex items-center gap-2'>
            {isEditing ? (
              <>
                <Edit className='w-5 h-5' />
                Edit Feedback
              </>
            ) : (
              <>
                <Eye className='w-5 h-5' />
                Feedback Details
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto px-6 py-4'>
          {isEditing ? (
            <div className='space-y-4'>
              <FeedbackForm
                person={person}
                feedback={{
                  id: feedback.id,
                  kind: feedback.kind as 'praise' | 'concern' | 'note',
                  isPrivate: feedback.isPrivate,
                  body: feedback.body,
                }}
                onSuccess={handleEditSuccess}
                onCancel={handleCancel}
              />
            </div>
          ) : (
            <div className='space-y-6'>
              {/* Header Information */}
              <div className='space-y-4'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <Badge variant={getKindVariant(feedback.kind)}>
                    {getKindLabel(feedback.kind)}
                  </Badge>
                  {feedback.isPrivate && (
                    <Badge
                      variant='neutral'
                      className='flex items-center gap-1'
                    >
                      <Lock className='w-3 h-3' />
                      Private
                    </Badge>
                  )}
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <User className='w-4 h-4' />
                    <span>
                      <span className='font-medium'>From:</span>{' '}
                      {feedback.from.name}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <Calendar className='w-4 h-4' />
                    <span>
                      <span className='font-medium'>Date:</span>{' '}
                      {formatDate(feedback.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className='space-y-2'>
                <h4 className='font-medium text-foreground'>
                  Feedback Content
                </h4>
                <div className='border border-border rounded-lg p-4 bg-muted/30'>
                  <ReadonlyNotesField
                    content={feedback.body}
                    variant='default'
                    emptyStateText='No feedback content available'
                  />
                </div>
              </div>

              {/* Actions */}
              {canEdit && (
                <div className='flex justify-end gap-2 pt-4 border-t'>
                  <Button
                    variant='outline'
                    onClick={() => setIsEditing(true)}
                    className='flex items-center gap-2'
                  >
                    <Edit className='w-4 h-4' />
                    Edit Feedback
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
