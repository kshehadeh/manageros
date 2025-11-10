'use client'

import { useState } from 'react'
import { Link } from '@/components/ui/link'
import { Rag } from '@/components/rag'
import { CheckInModal } from '@/components/checkin-modal'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SectionHeader } from '@/components/ui/section-header'
import { DeleteModal } from '@/components/common/delete-modal'
import { deleteCheckIn } from '@/lib/actions/checkin'
import { toast } from 'sonner'
import { CheckCircle, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react'

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
  const [deleteModalOpen, setDeleteModalOpen] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleFormSuccess = () => {
    setShowNewForm(false)
    setEditingCheckIn(null)
    // The page will be revalidated by the server action
  }

  const handleEditOpenChange = (open: boolean) => {
    if (!open) {
      setEditingCheckIn(null)
    }
  }

  const handleDelete = async (checkInId: string) => {
    setIsDeleting(true)
    try {
      await deleteCheckIn(checkInId)
      toast.success('Check-in deleted successfully')
      handleFormSuccess()
    } catch (error) {
      console.error('Error deleting check-in:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete check-in'
      )
    } finally {
      setIsDeleting(false)
      setDeleteModalOpen(null)
    }
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
      <SectionHeader
        icon={CheckCircle}
        title='Check-ins'
        action={
          <Button
            onClick={() => setShowNewForm(true)}
            variant='outline'
            size='sm'
          >
            <Plus className='h-4 w-4' />
            Add Check-in
          </Button>
        }
      />

      {/* Check-ins List */}
      <div className='space-y-4'>
        {checkIns.map(checkIn => (
          <div key={checkIn.id} className='space-y-3'>
            {/* Header */}
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='font-medium'>
                  Week of {formatWeekOf(checkIn.weekOf)}
                </div>
                <div className='text-sm text-muted-foreground mt-1 flex items-center gap-2'>
                  <Rag rag={checkIn.rag} />
                  <span>{checkIn.confidence}% confidence</span>
                  <span className='mx-1'>·</span>
                  <span>
                    Created by{' '}
                    <Link
                      href={`/people/${checkIn.createdBy.id}`}
                      className='text-primary hover:opacity-90'
                    >
                      {checkIn.createdBy.name}
                    </Link>{' '}
                    on {formatDate(checkIn.createdAt)}
                  </span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => setEditingCheckIn(checkIn)}>
                    <Edit className='h-4 w-4 mr-2' />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteModalOpen(checkIn.id)}
                    className='text-destructive'
                  >
                    <Trash2 className='h-4 w-4 mr-2' />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Content */}
            <div className='space-y-3'>
              <div>
                <div className='text-sm font-medium mb-1'>Summary</div>
                <div className='text-sm'>{checkIn.summary}</div>
              </div>

              {checkIn.blockers && (
                <div>
                  <div className='text-sm font-medium mb-1'>Blockers</div>
                  <div className='text-sm text-amber-300'>
                    {checkIn.blockers}
                  </div>
                </div>
              )}

              {checkIn.nextSteps && (
                <div>
                  <div className='text-sm font-medium mb-1'>Next Steps</div>
                  <div className='text-sm'>{checkIn.nextSteps}</div>
                </div>
              )}
            </div>
          </div>
        ))}

        {checkIns.length === 0 && (
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <CheckCircle className='h-8 w-8 text-muted-foreground mb-2' />
            <p className='text-muted-foreground text-sm mb-4'>
              No check-ins yet
            </p>
          </div>
        )}
      </div>

      {/* New Check-in Modal */}
      <CheckInModal
        initiativeId={initiativeId}
        initiativeTitle={initiativeTitle}
        open={showNewForm}
        onOpenChange={setShowNewForm}
        onSuccess={handleFormSuccess}
      />

      {/* Edit Check-in Modal */}
      {editingCheckIn && (
        <CheckInModal
          initiativeId={initiativeId}
          initiativeTitle={initiativeTitle}
          checkIn={editingCheckIn}
          open={!!editingCheckIn}
          onOpenChange={handleEditOpenChange}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <DeleteModal
          isOpen={!!deleteModalOpen}
          onClose={() => setDeleteModalOpen(null)}
          onConfirm={() => {
            if (deleteModalOpen) {
              void handleDelete(deleteModalOpen)
            }
          }}
          title='Delete Check-in'
          entityName='check-in'
          isLoading={isDeleting}
        />
      )}
    </div>
  )
}
