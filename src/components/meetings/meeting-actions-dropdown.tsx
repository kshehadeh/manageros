'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link } from '@/components/ui/link'
import {
  Edit,
  Trash2,
  Building2,
  Target,
  User,
  CalendarPlus,
  Link as LinkIcon,
} from 'lucide-react'
import { deleteMeeting } from '@/lib/actions/meeting'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { DeleteModal } from '@/components/common/delete-modal'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LinkForm } from '@/components/entity-links'

interface MeetingActionsDropdownProps {
  meetingId: string
  meeting: {
    team?: { id: string; name: string } | null
    initiative?: { id: string; title: string } | null
    owner?: { id: string; name: string } | null
  }
  size?: 'sm' | 'default'
  canEdit?: boolean
  canDelete?: boolean
}

export function MeetingActionsDropdown({
  meetingId,
  meeting,
  size = 'sm',
  canEdit = false,
  canDelete = false,
}: MeetingActionsDropdownProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteMeeting(meetingId)
      toast.success('Meeting deleted successfully')
    } catch (error) {
      console.error('Error deleting meeting:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete meeting'
      )
    }
  }

  const handleLinkSuccess = () => {
    setShowLinkModal(false)
    router.refresh()
  }

  const hasActions =
    canEdit || canDelete || meeting.team || meeting.initiative || meeting.owner

  // Don't show dropdown if user has no permissions and no navigation links
  if (!hasActions) {
    return null
  }

  return (
    <>
      <ActionDropdown
        size={size}
        onOpenChange={open => {
          if (!open) {
            // nothing extra to manage
          }
        }}
      >
        {({ close }) => (
          <div className='py-1'>
            {canEdit && (
              <Link
                href={`/meetings/${meetingId}/edit`}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={close}
              >
                <Edit className='w-4 h-4' />
                Edit Meeting
              </Link>
            )}

            {(canEdit ||
              meeting.team ||
              meeting.initiative ||
              meeting.owner) && (
              <>
                {canEdit && <div className='border-t border-border my-1' />}
                {canEdit && (
                  <>
                    <Link
                      href={`/meetings/${meetingId}/instances/new`}
                      className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                      onClick={close}
                    >
                      <CalendarPlus className='w-4 h-4' />
                      Create Instance
                    </Link>
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
                  </>
                )}

                {meeting.team && (
                  <Link
                    href={`/teams/${meeting.team.id}`}
                    className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                    onClick={close}
                  >
                    <Building2 className='w-4 h-4' />
                    View Team
                  </Link>
                )}

                {meeting.initiative && (
                  <Link
                    href={`/initiatives/${meeting.initiative.id}`}
                    className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                    onClick={close}
                  >
                    <Target className='w-4 h-4' />
                    View Initiative
                  </Link>
                )}

                {meeting.owner && (
                  <Link
                    href={`/people/${meeting.owner.id}`}
                    className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                    onClick={close}
                  >
                    <User className='w-4 h-4' />
                    View Owner
                  </Link>
                )}
              </>
            )}

            {canDelete && (
              <>
                {(canEdit ||
                  meeting.team ||
                  meeting.initiative ||
                  meeting.owner) && (
                  <div className='border-t border-border my-1' />
                )}

                <button
                  className='flex w-full items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors text-left'
                  onClick={event => {
                    event.stopPropagation()
                    close()
                    setShowDeleteModal(true)
                  }}
                >
                  <Trash2 className='w-4 h-4' />
                  Delete Meeting
                </button>
              </>
            )}
          </div>
        )}
      </ActionDropdown>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title='Delete Meeting'
        entityName='meeting'
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
              meeting.
            </DialogDescription>
          </DialogHeader>
          <LinkForm
            entityType='Meeting'
            entityId={meetingId}
            onSuccess={handleLinkSuccess}
            onCancel={() => setShowLinkModal(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
