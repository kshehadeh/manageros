'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Rag } from '@/components/rag'
import { CheckInForm } from '@/components/checkin-form'
import { DeleteCheckInButton } from '@/components/delete-checkin-button'
import { Button } from '@/components/ui/button'
import { EditIconButton } from './edit-icon-button'

interface CheckIn {
  id: string
  weekOf: string
  rag: string
  confidence: number
  summary: string
  blockers?: string | null
  nextSteps?: string | null
  createdAt: string
  createdBy: {
    id: string
    name: string
  }
}

interface CheckInListProps {
  initiativeId: string
  initiativeTitle: string
  checkIns: CheckIn[]
}

export function CheckInList({
  initiativeId,
  initiativeTitle,
  checkIns,
}: CheckInListProps) {
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingCheckIn, setEditingCheckIn] = useState<CheckIn | null>(null)

  const handleFormSuccess = () => {
    setShowNewForm(false)
    setEditingCheckIn(null)
    // The page will be revalidated by the server action
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatWeekOf = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='font-semibold'>Check-ins</h3>
        <Button onClick={() => setShowNewForm(true)} variant='outline' size='sm'>
          Add Check-in
        </Button>
      </div>

      {/* New Check-in Form */}
      {showNewForm && (
        <div className='card'>
          <CheckInForm
            initiativeId={initiativeId}
            initiativeTitle={initiativeTitle}
            onSuccess={handleFormSuccess}
          />
        </div>
      )}

      {/* Check-ins List */}
      <div className='space-y-3'>
        {checkIns.map(checkIn => (
          <div
            key={checkIn.id}
            className='border rounded-xl p-4 space-y-3'
          >
            {/* Header */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div>
                  <div className='font-medium'>
                    Week of {formatWeekOf(checkIn.weekOf)}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Created by{' '}
                    <Link
                      href={`/people/${checkIn.createdBy.id}`}
                      className='text-primary hover:opacity-90'
                    >
                      {checkIn.createdBy.name}
                    </Link>{' '}
                    on {formatDate(checkIn.createdAt)}
                  </div>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Rag rag={checkIn.rag} />
                <span className='badge'>{checkIn.confidence}%</span>
              </div>
            </div>

            {/* Content */}
            <div className='space-y-2'>
              <div>
                <div className='text-sm font-medium text-muted-foreground mb-1'>
                  Summary
                </div>
                <div className='text-sm'>{checkIn.summary}</div>
              </div>

              {checkIn.blockers && (
                <div>
                  <div className='text-sm font-medium text-muted-foreground mb-1'>
                    Blockers
                  </div>
                  <div className='text-sm text-amber-300'>
                    {checkIn.blockers}
                  </div>
                </div>
              )}

              {checkIn.nextSteps && (
                <div>
                  <div className='text-sm font-medium text-muted-foreground mb-1'>
                    Next Steps
                  </div>
                  <div className='text-sm text-emerald-300'>
                    {checkIn.nextSteps}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className='flex items-center gap-2 pt-2 border-t'>
              <EditIconButton
                href={`/initiatives/${initiativeId}/checkins/${checkIn.id}/edit`}
                variant='outline'
                size='sm'
              />
              <DeleteCheckInButton
                checkInId={checkIn.id}
                onSuccess={handleFormSuccess}
              />
            </div>
          </div>
        ))}

        {checkIns.length === 0 && !showNewForm && (
          <div className='text-center py-8 text-muted-foreground'>
            <div className='text-lg font-medium mb-2'>No check-ins yet</div>
            <div className='text-sm mb-4'>
              Start tracking progress with regular check-ins
            </div>
            <Button onClick={() => setShowNewForm(true)} variant='outline'>
              Add First Check-in
            </Button>
          </div>
        )}
      </div>

      {/* Edit Check-in Form */}
      {editingCheckIn && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
          <div className='bg-popover text-popover-foreground border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
            <CheckInForm
              initiativeId={initiativeId}
              initiativeTitle={initiativeTitle}
              checkIn={editingCheckIn}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}
    </div>
  )
}
