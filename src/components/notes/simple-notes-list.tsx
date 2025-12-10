'use client'

import { NoteWithAttachments } from '@/types/notes'
import { formatDistanceToNow } from 'date-fns'
import { FileText, MoreHorizontal, Trash2, Edit, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleListItem } from '@/components/common/simple-list-item'
import { SimpleListItemsContainer } from '@/components/common/simple-list-items-container'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deleteNote } from '@/lib/actions/notes'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'

interface SimpleNotesListProps {
  notes: NoteWithAttachments[]
  canEdit?: boolean
  onEdit?: (note: NoteWithAttachments) => void
  onDelete?: (noteId: string) => void
  maxContentLength?: number
}

export function SimpleNotesList({
  notes,
  canEdit = false,
  onEdit,
  onDelete,
  maxContentLength = 150,
}: SimpleNotesListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (noteId: string) => {
    if (onDelete) {
      onDelete(noteId)
      return
    }

    setDeletingId(noteId)
    try {
      await deleteNote({ id: noteId })
      toast.success('Note deleted successfully')
      router.refresh()
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete note'
      )
    } finally {
      setDeletingId(null)
    }
  }

  const getPreview = (content: string) => {
    // Remove markdown syntax for preview
    const plainText = content
      .replace(/^#+\s+/gm, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .trim()

    if (plainText.length <= maxContentLength) return plainText
    return plainText.substring(0, maxContentLength) + '...'
  }

  return (
    <SimpleListItemsContainer
      isEmpty={notes.length === 0}
      emptyStateText='No notes yet'
    >
      {notes.map(note => (
        <SimpleListItem key={note.id}>
          <div className='flex items-start gap-3 flex-1 min-w-0'>
            <div className='relative shrink-0 mt-0.5'>
              <FileText className='h-4 w-4 text-muted-foreground' />
              {note.sharedWith && note.sharedWith.length > 0 && (
                <span
                  title='Shared note'
                  className='absolute -top-1 -right-1 bg-background rounded-full p-0.5'
                >
                  <Users className='h-3 w-3 text-muted-foreground' />
                </span>
              )}
            </div>
            <div className='flex-1 min-w-0'>
              <h3 className='font-medium text-sm truncate mb-1'>
                {note.title || 'Untitled'}
              </h3>
              <div className='flex items-center gap-2 text-xs text-muted-foreground mb-1'>
                <span className='truncate'>
                  {note.entityType || 'Standalone'}
                </span>
                <span>•</span>
                <span className='truncate'>{note.createdBy.name}</span>
                <span>•</span>
                <span>
                  Updated{' '}
                  {formatDistanceToNow(new Date(note.updatedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <div className='text-sm'>
                <ReadonlyNotesField
                  content={getPreview(note.content)}
                  variant='compact'
                  showEmptyState={false}
                />
              </div>
            </div>
          </div>

          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 p-0 shrink-0'
                  disabled={deletingId === note.id}
                >
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(note)}>
                    <Edit className='h-4 w-4 mr-2' />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleDelete(note.id)}
                  className='text-destructive'
                >
                  <Trash2 className='h-4 w-4 mr-2' />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </SimpleListItem>
      ))}
    </SimpleListItemsContainer>
  )
}
