'use client'

import { NoteWithAttachments } from '@/types/notes'
import { formatDistanceToNow } from 'date-fns'
import { FileText, Trash2, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deleteStandaloneNote } from '@/lib/actions/notes'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface NotesListProps {
  notes: NoteWithAttachments[]
}

export function NotesList({ notes }: NotesListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteStandaloneNote({ id })
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

  const getPreview = (content: string, maxLength: number = 150) => {
    // Remove markdown syntax for preview
    const plainText = content
      .replace(/^#+\s+/gm, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .trim()

    if (plainText.length <= maxLength) return plainText
    return plainText.substring(0, maxLength) + '...'
  }

  if (notes.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <FileText className='h-12 w-12 text-muted-foreground mb-4' />
        <h3 className='text-lg font-semibold mb-2'>No notes yet</h3>
        <p className='text-muted-foreground mb-4'>
          Get started by creating your first note
        </p>
        <Button asChild>
          <Link href='/notes/new'>
            <Plus className='h-4 w-4 mr-2' />
            Create Note
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
      {notes.map(note => (
        <Card
          key={note.id}
          className='flex flex-col hover:shadow-md transition-shadow'
        >
          <CardHeader className='flex-1'>
            <div className='flex items-start justify-between gap-2'>
              <CardTitle className='line-clamp-2 flex-1 flex items-center gap-2'>
                <Link
                  href={`/notes/${note.id}`}
                  className='hover:text-primary transition-colors flex items-center gap-2'
                >
                  {note.title || 'Untitled'}
                  {note.sharedWith && note.sharedWith.length > 0 && (
                    <span title='Shared note'>
                      <Users className='h-4 w-4 text-muted-foreground' />
                    </span>
                  )}
                </Link>
              </CardTitle>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 w-8 p-0 flex-shrink-0'
                    disabled={deletingId === note.id}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Note</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "
                      {note.title || 'Untitled'}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(note.id)}
                      className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <CardDescription>
              {formatDistanceToNow(new Date(note.updatedAt), {
                addSuffix: true,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground line-clamp-3'>
              {getPreview(note.content)}
            </p>
            {note.attachments.length > 0 && (
              <p className='text-xs text-muted-foreground mt-2'>
                {note.attachments.length} attachment
                {note.attachments.length !== 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
