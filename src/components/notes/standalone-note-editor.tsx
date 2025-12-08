'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NotionEditor } from './notion-editor'
import { NoteWithAttachments } from '@/types/notes'
import { createStandaloneNote, updateStandaloneNote } from '@/lib/actions/notes'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Save, Loader2 } from 'lucide-react'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { NoteSharingPanel } from './note-sharing-panel'
import { format } from 'date-fns'

interface StandaloneNoteEditorProps {
  note?: NoteWithAttachments
  currentUserId?: string
}

export function StandaloneNoteEditor({
  note,
  currentUserId,
}: StandaloneNoteEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const isCreator =
    note && currentUserId ? note.createdBy.id === currentUserId : true

  // Debounce auto-save for existing notes
  const debouncedContent = useDebounce(content, 2000)
  const debouncedTitle = useDebounce(title, 2000)

  // Auto-save for existing notes
  useEffect(() => {
    if (
      note &&
      (debouncedContent !== note.content || debouncedTitle !== note.title) &&
      debouncedContent.trim() &&
      debouncedTitle.trim()
    ) {
      handleAutoSave()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContent, debouncedTitle])

  const handleAutoSave = async () => {
    if (!note || isSaving) return

    setIsSaving(true)
    try {
      await updateStandaloneNote({
        id: note.id,
        title: debouncedTitle || undefined,
        content: debouncedContent,
      })
      setHasChanges(false)
    } catch (error) {
      console.error('Error auto-saving note:', error)
      // Don't show toast for auto-save errors to avoid spam
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title for your note')
      return
    }

    if (!content.trim()) {
      toast.error('Please enter some content for your note')
      return
    }

    setIsSaving(true)
    try {
      if (note) {
        // Update existing note
        await updateStandaloneNote({
          id: note.id,
          title: title.trim(),
          content: content.trim(),
        })
        toast.success('Note saved successfully')
        setHasChanges(false)
      } else {
        // Create new note
        const result = await createStandaloneNote({
          title: title.trim(),
          content: content.trim(),
        })
        toast.success('Note created successfully')
        router.push(`/notes/${result.note.id}`)
        router.refresh()
      }
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to save note'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    if (note) {
      setHasChanges(newTitle !== note.title || content !== note.content)
    }
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    if (note) {
      setHasChanges(title !== note.title || newContent !== note.content)
    }
  }

  return (
    <div className='flex flex-col h-full max-w-4xl mx-auto'>
      {/* Title and Actions Header */}
      <div className='flex items-center justify-between gap-4 mb-4 pb-4 border-b'>
        <div className='flex-1 min-w-0'>
          <input
            type='text'
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder='Untitled'
            className='w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground focus:ring-0'
            autoFocus={!note}
          />
        </div>
        <div className='flex items-center gap-2 flex-shrink-0'>
          {isSaving && (
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Loader2 className='h-4 w-4 animate-spin' />
              <span className='hidden sm:inline'>Saving...</span>
            </div>
          )}
          {hasChanges && !isSaving && (
            <span className='text-sm text-muted-foreground hidden sm:inline'>
              Unsaved changes
            </span>
          )}
          {note && (
            <NoteSharingPanel
              noteId={note.id}
              sharedWith={note.sharedWith}
              sharedWithEveryone={note.sharedWithEveryone}
              isCreator={isCreator}
            />
          )}
          <Button
            size='sm'
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !content.trim()}
            className='flex items-center gap-2'
          >
            <Save className='h-4 w-4' />
            {note ? 'Save' : 'Create Note'}
          </Button>
        </div>
      </div>

      {/* Metadata - Only show for existing notes */}
      {note && (
        <div className='mb-4 pb-4 border-b'>
          <div className='flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground'>
            <div className='flex items-center gap-2'>
              <span className='font-medium text-foreground'>Created by:</span>
              <span>{note.createdBy.name}</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='font-medium text-foreground'>Created:</span>
              <span>
                {format(new Date(note.createdAt), 'MMM dd, yyyy h:mm a')}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='font-medium text-foreground'>Last updated:</span>
              <span>
                {format(new Date(note.updatedAt), 'MMM dd, yyyy h:mm a')}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='font-medium text-foreground'>Shared with:</span>
              <span>
                {note.sharedWithEveryone
                  ? 'Organization'
                  : note.sharedWith && note.sharedWith.length > 0
                    ? 'Specific People'
                    : 'No one'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className='flex-1 overflow-y-auto'>
        <NotionEditor
          content={content}
          onChange={handleContentChange}
          placeholder='Start writing...'
          autoFocus={false}
        />
      </div>
    </div>
  )
}
