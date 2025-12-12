'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Link } from '@/components/ui/link'
import {
  Edit,
  Trash2,
  Plus,
  FileText,
  Link as LinkIcon,
  CheckCircle,
  Target,
  Users,
} from 'lucide-react'
import { deleteInitiative, createObjective } from '@/lib/actions/initiative'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { DeleteModal } from '@/components/common/delete-modal'
import { toast } from 'sonner'
import {
  TaskQuickEditDialog,
  type TaskQuickEditDialogRef,
} from '@/components/tasks/task-quick-edit-dialog'
import { NoteEditorModal } from '@/components/notes/note-editor-modal'
import { createNote } from '@/lib/actions/notes'
import { CheckInModal } from '@/components/checkin-modal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LinkForm } from '@/components/entity-links'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ManageOwnersModal } from './manage-owners-modal'

export interface InitiativeActionsDropdownProps {
  initiativeId: string
  initiativeTitle: string
  size?: 'sm' | 'default'
  canEdit?: boolean
  canDelete?: boolean
  canCreateTask?: boolean
}

export function InitiativeActionsDropdown({
  initiativeId,
  initiativeTitle,
  size = 'sm',
  canEdit = false,
  canDelete = false,
  canCreateTask = false,
}: InitiativeActionsDropdownProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [showObjectiveModal, setShowObjectiveModal] = useState(false)
  const [showManagePeopleModal, setShowManagePeopleModal] = useState(false)
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)
  const [isSubmittingObjective, setIsSubmittingObjective] = useState(false)
  const [objectiveFormData, setObjectiveFormData] = useState({
    title: '',
    keyResult: '',
  })
  const taskDialogRef = useRef<TaskQuickEditDialogRef>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteInitiative(initiativeId)
      toast.success('Initiative deleted successfully')
      router.push('/initiatives')
    } catch (error) {
      console.error('Error deleting initiative:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete initiative'
      )
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // Don't show dropdown if user has no permissions
  if (!canEdit && !canDelete && !canCreateTask) {
    return null
  }

  const handleTaskDialogOpen = () => {
    setShowTaskDialog(true)
    // Small delay to ensure the dialog is fully rendered before focusing
    setTimeout(() => {
      taskDialogRef.current?.focus()
    }, 100)
  }

  const handleNoteSave = async (data: { title: string; content: string }) => {
    setIsSubmittingNote(true)
    try {
      await createNote({
        entityType: 'Initiative',
        entityId: initiativeId,
        content: data.content,
        title: data.title || undefined,
      })
      toast.success('Note created successfully')
      setShowNoteModal(false)
      router.refresh()
    } catch (error) {
      console.error('Error creating note:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to create note'
      )
    } finally {
      setIsSubmittingNote(false)
    }
  }

  const handleLinkSuccess = () => {
    setShowLinkModal(false)
    router.refresh()
  }

  const handleCheckInSuccess = () => {
    setShowCheckInModal(false)
    router.refresh()
  }

  const handleObjectiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingObjective(true)

    try {
      await createObjective(
        initiativeId,
        objectiveFormData.title,
        objectiveFormData.keyResult || undefined
      )

      toast.success('Objective created successfully')
      setShowObjectiveModal(false)
      setObjectiveFormData({
        title: '',
        keyResult: '',
      })
      router.refresh()
    } catch (error) {
      console.error('Failed to create objective:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to create objective'
      )
    } finally {
      setIsSubmittingObjective(false)
    }
  }

  return (
    <>
      <ActionDropdown size={size}>
        {({ close }) => (
          <div className='py-1'>
            {canCreateTask && (
              <button
                className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
                onClick={event => {
                  event.stopPropagation()
                  close()
                  handleTaskDialogOpen()
                }}
              >
                <Plus className='w-4 h-4' />
                Add Task
              </button>
            )}

            {canEdit && (
              <>
                {canCreateTask && (
                  <div className='border-t border-border my-1' />
                )}
                <button
                  className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
                  onClick={event => {
                    event.stopPropagation()
                    close()
                    setShowManagePeopleModal(true)
                  }}
                >
                  <Users className='w-4 h-4' />
                  Manage People
                </button>
                <button
                  className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
                  onClick={event => {
                    event.stopPropagation()
                    close()
                    setShowNoteModal(true)
                  }}
                >
                  <FileText className='w-4 h-4' />
                  Add Note
                </button>
                <button
                  className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
                  onClick={event => {
                    event.stopPropagation()
                    close()
                    setShowLinkModal(true)
                  }}
                >
                  <LinkIcon className='w-4 h-4' />
                  Add Link
                </button>
                <button
                  className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
                  onClick={event => {
                    event.stopPropagation()
                    close()
                    setShowCheckInModal(true)
                  }}
                >
                  <CheckCircle className='w-4 h-4' />
                  Add Check-In
                </button>
                <button
                  className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
                  onClick={event => {
                    event.stopPropagation()
                    close()
                    setShowObjectiveModal(true)
                  }}
                >
                  <Target className='w-4 h-4' />
                  Add Objective
                </button>
              </>
            )}

            {canEdit && (
              <>
                <div className='border-t border-border my-1' />
                <Link
                  href={`/initiatives/${initiativeId}/edit`}
                  className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                  onClick={close}
                >
                  <Edit className='w-4 h-4' />
                  Edit Initiative
                </Link>
              </>
            )}

            {(canCreateTask || canEdit) && canDelete && (
              <div className='border-t border-border my-1' />
            )}

            {canDelete && (
              <button
                className='flex w-full items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors text-left'
                onClick={event => {
                  event.stopPropagation()
                  close()
                  setShowDeleteModal(true)
                }}
              >
                <Trash2 className='w-4 h-4' />
                Delete Initiative
              </button>
            )}
          </div>
        )}
      </ActionDropdown>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title='Delete Initiative'
        entityName='initiative'
        isLoading={isDeleting}
      />

      <TaskQuickEditDialog
        ref={taskDialogRef}
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        initiativeId={initiativeId}
        onSuccess={() => {
          setShowTaskDialog(false)
          router.refresh()
        }}
      />

      {/* Add Note Modal */}
      <NoteEditorModal
        open={showNoteModal}
        onOpenChange={setShowNoteModal}
        onSave={handleNoteSave}
        isLoading={isSubmittingNote}
        mode='create'
      />

      {/* Add Link Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <LinkIcon className='h-5 w-5' />
              Add Link
            </DialogTitle>
            <DialogDescription>
              Add a link to provide additional context and resources for this
              initiative.
            </DialogDescription>
          </DialogHeader>
          <LinkForm
            entityType='Initiative'
            entityId={initiativeId}
            onSuccess={handleLinkSuccess}
            onCancel={() => setShowLinkModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Check-In Modal */}
      <CheckInModal
        initiativeId={initiativeId}
        initiativeTitle={initiativeTitle}
        open={showCheckInModal}
        onOpenChange={setShowCheckInModal}
        onSuccess={handleCheckInSuccess}
      />

      {/* Add Objective Modal */}
      <Dialog open={showObjectiveModal} onOpenChange={setShowObjectiveModal}>
        <DialogContent size='sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Target className='h-5 w-5' />
              Add New Objective
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleObjectiveSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='objective-title'>Objective Title</Label>
              <Input
                id='objective-title'
                value={objectiveFormData.title}
                onChange={e =>
                  setObjectiveFormData(prev => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder='Enter objective title'
                required
                disabled={isSubmittingObjective}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='objective-keyResult'>Key Result (Optional)</Label>
              <Textarea
                id='objective-keyResult'
                value={objectiveFormData.keyResult}
                onChange={e =>
                  setObjectiveFormData(prev => ({
                    ...prev,
                    keyResult: e.target.value,
                  }))
                }
                placeholder='Enter key result description'
                rows={3}
                disabled={isSubmittingObjective}
              />
            </div>

            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setShowObjectiveModal(false)}
                disabled={isSubmittingObjective}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={
                  isSubmittingObjective || !objectiveFormData.title.trim()
                }
              >
                {isSubmittingObjective ? 'Creating...' : 'Create Objective'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage People Modal */}
      <ManageOwnersModal
        initiativeId={initiativeId}
        open={showManagePeopleModal}
        onOpenChange={setShowManagePeopleModal}
      />
    </>
  )
}
