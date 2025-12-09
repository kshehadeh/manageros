'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NotionEditor } from '@/components/notes/notion-editor'
import { NoteWithAttachments } from '@/types/notes'
import { Loader2 } from 'lucide-react'

interface NoteEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note?: NoteWithAttachments | null
  onSave: (data: { title: string; content: string }) => Promise<void>
  isLoading?: boolean
  mode?: 'create' | 'edit'
}

/**
 * A modal-based note editor with tiptap editor support and title field.
 * Can be used for both creating and editing notes.
 */
export function NoteEditorModal({
  open,
  onOpenChange,
  note,
  onSave,
  isLoading = false,
  mode = 'create',
}: NoteEditorModalProps) {
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [isSaving, setIsSaving] = useState(false)

  // Reset form when modal opens/closes or note changes
  useEffect(() => {
    if (open) {
      setTitle(note?.title || '')
      setContent(note?.content || '')
    }
  }, [open, note])

  const handleSave = async () => {
    if (!content.trim()) {
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
      })
      // Reset form after successful save
      setTitle('')
      setContent('')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      onOpenChange(false)
    }
  }

  const isSubmitting = isSaving || isLoading

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size='md' className='flex flex-col max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add Note' : 'Edit Note'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new note with a title and rich text content.'
              : 'Update the note title and content.'}
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 space-y-4 overflow-hidden'>
          <div className='space-y-2'>
            <Label htmlFor='note-title'>Title (optional)</Label>
            <Input
              id='note-title'
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder='Enter a title for your note...'
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className='space-y-2 flex-1 min-h-0'>
            <Label htmlFor='note-content'>Content *</Label>
            <div className='min-h-[300px]'>
              <NotionEditor
                value={content}
                onChange={setContent}
                placeholder='Write your note here...'
                heightClassName='min-h-[250px] max-h-[40vh]'
                showToolbarAlways={true}
              />
            </div>
          </div>
        </div>

        <DialogFooter className='flex-shrink-0'>
          <Button
            type='button'
            variant='outline'
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                {mode === 'create' ? 'Creating...' : 'Saving...'}
              </>
            ) : mode === 'create' ? (
              'Create Note'
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
