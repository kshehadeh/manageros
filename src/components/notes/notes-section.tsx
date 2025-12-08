'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  createNote,
  updateNote,
  deleteNote,
  deleteFileAttachment,
} from '@/lib/actions/notes'
import { NoteWithAttachments } from '@/types/notes'
import { toast } from 'sonner'
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Paperclip,
  Download,
  FileText,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getFileIcon, formatFileSize, isImageMimeType } from '@/lib/file-utils'
import { SimpleNotesList } from './simple-notes-list'

interface NotesSectionProps {
  entityType: string
  entityId: string
  notes: NoteWithAttachments[]
  canEdit?: boolean
}

export function NotesSection({
  entityType,
  entityId,
  notes,
  canEdit = false,
}: NotesSectionProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<NoteWithAttachments | null>(
    null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [lightboxImage, setLightboxImage] = useState<{
    src: string
    alt: string
  } | null>(null)

  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(noteId)) {
        newSet.delete(noteId)
      } else {
        newSet.add(noteId)
      }
      return newSet
    })
  }

  const getTruncatedContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content

    // Find the last space before the max length to avoid cutting words
    const truncated = content.substring(0, maxLength)
    const lastSpaceIndex = truncated.lastIndexOf(' ')

    if (lastSpaceIndex > maxLength * 0.8) {
      // If we found a space reasonably close to the max length, use it
      return truncated.substring(0, lastSpaceIndex) + '...'
    } else {
      // Otherwise, just cut at max length
      return truncated + '...'
    }
  }

  const handleCreateNote = async (formData: FormData) => {
    const content = formData.get('content') as string

    if (!content.trim()) {
      toast.error('Note content is required')
      return
    }

    setIsSubmitting(true)
    try {
      await createNote({
        entityType,
        entityId,
        content: content.trim(),
        files: selectedFiles.length > 0 ? selectedFiles : undefined,
      })

      toast.success('Note created successfully')
      setIsCreateDialogOpen(false)
      setSelectedFiles([])
    } catch (error) {
      console.error('Error creating note:', error)

      // Don't handle redirect errors - let them bubble up
      if (error && typeof error === 'object' && 'digest' in error) {
        const digest = (error as { digest?: string }).digest
        if (digest?.startsWith('NEXT_REDIRECT')) {
          throw error // Re-throw redirect errors
        }
      }

      toast.error(
        error instanceof Error ? error.message : 'Failed to create note'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateNote = async (formData: FormData) => {
    if (!editingNote) return

    const content = formData.get('content') as string

    if (!content.trim()) {
      toast.error('Note content is required')
      return
    }

    setIsSubmitting(true)
    try {
      await updateNote({
        id: editingNote.id,
        content: content.trim(),
      })

      toast.success('Note updated successfully')
      setIsEditDialogOpen(false)
      setEditingNote(null)
    } catch (error) {
      console.error('Error updating note:', error)

      // Don't handle redirect errors - let them bubble up
      if (error && typeof error === 'object' && 'digest' in error) {
        const digest = (error as { digest?: string }).digest
        if (digest?.startsWith('NEXT_REDIRECT')) {
          throw error // Re-throw redirect errors
        }
      }

      toast.error(
        error instanceof Error ? error.message : 'Failed to update note'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote({ id: noteId })
      toast.success('Note deleted successfully')
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete note'
      )
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteFileAttachment({ id: attachmentId })
      toast.success('Attachment deleted successfully')
    } catch (error) {
      console.error('Error deleting attachment:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete attachment'
      )
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles: File[] = []
    Array.from(files).forEach(file => {
      // Basic validation
      if (file.size > 50 * 1024 * 1024) {
        // 50MB
        toast.error(`${file.name}: File size must be less than 50MB`)
        return
      }
      newFiles.push(file)
    })

    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const openEditDialog = (note: NoteWithAttachments) => {
    setEditingNote(note)
    setIsEditDialogOpen(true)
  }

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false)
    setSelectedFiles([])
  }

  const closeEditDialog = () => {
    setIsEditDialogOpen(false)
    setEditingNote(null)
  }

  const openLightbox = (src: string, alt: string) => {
    setLightboxImage({ src, alt })
  }

  const closeLightbox = () => {
    setLightboxImage(null)
  }

  return (
    <>
      <PageSection
        header={
          <SectionHeader
            icon={FileText}
            title='Notes'
            action={
              canEdit ? (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  size='sm'
                  className='flex items-center gap-2'
                >
                  <Plus className='h-4 w-4' />
                  Add Note
                </Button>
              ) : undefined
            }
          />
        }
      >
        {entityType === 'Initiative' ? (
          <SimpleNotesList
            notes={notes}
            canEdit={canEdit}
            onEdit={openEditDialog}
            onDelete={handleDeleteNote}
          />
        ) : (
          <div className='space-y-4'>
            {notes.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-8 text-center'>
                <FileText className='h-8 w-8 text-muted-foreground mb-2' />
                <p className='text-muted-foreground text-sm mb-4'>
                  No notes yet
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {notes.map(note => (
                  <div key={note.id}>
                    <div className='p-4 pb-3'>
                      <div className='flex items-start justify-between'>
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-8 w-8'>
                            <AvatarFallback>
                              {note.createdBy.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium text-sm'>
                              {note.createdBy.name}
                            </p>
                            <p className='text-xs text-muted-foreground'>
                              {formatDistanceToNow(new Date(note.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                        {canEdit && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='h-8 w-8 p-0'
                              >
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() => openEditDialog(note)}
                              >
                                <Edit className='h-4 w-4 mr-2' />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteNote(note.id)}
                                className='text-destructive'
                              >
                                <Trash2 className='h-4 w-4 mr-2' />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    <div className='px-4 pb-4'>
                      <ReadonlyNotesField
                        content={
                          expandedNotes.has(note.id)
                            ? note.content
                            : getTruncatedContent(note.content)
                        }
                        variant='compact'
                        showEmptyState={false}
                      />
                      {note.content.length > 200 && (
                        <button
                          onClick={() => toggleNoteExpansion(note.id)}
                          className='mt-2 text-sm text-primary hover:text-highlight/80 flex items-center gap-1'
                        >
                          {expandedNotes.has(note.id) ? (
                            <>
                              <ChevronUp className='h-3 w-3' />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className='h-3 w-3' />
                              Show more
                            </>
                          )}
                        </button>
                      )}

                      {note.attachments.length > 0 && (
                        <div className='mt-4 space-y-2'>
                          <p className='text-sm font-medium text-muted-foreground'>
                            Attachments:
                          </p>
                          <div className='grid grid-cols-1 gap-2'>
                            {note.attachments.map(
                              (
                                attachment: NoteWithAttachments['attachments'][0]
                              ) => (
                                <div
                                  key={attachment.id}
                                  className='flex items-center justify-between p-2 border rounded-lg bg-muted/50'
                                >
                                  <div className='flex items-center gap-2 flex-1 min-w-0'>
                                    {isImageMimeType(attachment.mimeType) ? (
                                      <div className='relative w-12 h-12'>
                                        <Image
                                          src={attachment.r2Url}
                                          alt={attachment.originalName}
                                          width={48}
                                          height={48}
                                          className='object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity'
                                          onClick={() =>
                                            openLightbox(
                                              attachment.r2Url,
                                              attachment.originalName
                                            )
                                          }
                                          onError={e => {
                                            // Fallback to file icon if image fails to load
                                            const target =
                                              e.target as HTMLImageElement
                                            target.style.display = 'none'
                                            const fallback =
                                              target.nextElementSibling as HTMLElement
                                            if (fallback) {
                                              fallback.style.display = 'block'
                                            }
                                          }}
                                        />
                                        <span
                                          className='text-lg absolute inset-0 flex items-center justify-center bg-muted rounded border'
                                          style={{ display: 'none' }}
                                        >
                                          {getFileIcon(attachment.mimeType)}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className='text-lg'>
                                        {getFileIcon(attachment.mimeType)}
                                      </span>
                                    )}
                                    <div className='min-w-0 flex-1'>
                                      <p className='text-sm font-medium truncate'>
                                        {attachment.originalName}
                                      </p>
                                      <p className='text-xs text-muted-foreground'>
                                        {formatFileSize(attachment.fileSize)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className='flex items-center gap-1'>
                                    <Button
                                      variant='ghost'
                                      size='sm'
                                      onClick={() =>
                                        window.open(attachment.r2Url, '_blank')
                                      }
                                      className='h-8 w-8 p-0'
                                    >
                                      <Download className='h-4 w-4' />
                                    </Button>
                                    <Button
                                      variant='ghost'
                                      size='sm'
                                      onClick={() =>
                                        handleDeleteAttachment(attachment.id)
                                      }
                                      className='h-8 w-8 p-0 text-destructive hover:text-destructive'
                                    >
                                      <X className='h-4 w-4' />
                                    </Button>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </PageSection>

      {/* Create Note Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a note with optional file attachments
            </DialogDescription>
          </DialogHeader>
          <form action={handleCreateNote} className='space-y-4'>
            <div className='space-y-2'>
              <label htmlFor='content' className='text-sm font-medium'>
                Content *
              </label>
              <Textarea
                id='content'
                name='content'
                placeholder='Write your note here...'
                rows={6}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                Attachments (Optional)
              </label>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Paperclip className='mx-auto h-8 w-8 text-muted-foreground mb-2' />
                <p className='text-sm text-muted-foreground mb-2'>
                  Drag & drop files here, or{' '}
                  <button
                    type='button'
                    onClick={() => fileInputRef.current?.click()}
                    className='text-primary hover:underline hover:text-highlight'
                    disabled={isSubmitting}
                  >
                    browse files
                  </button>
                </p>
                <p className='text-xs text-muted-foreground'>
                  Supports images, PDFs, documents (max 50MB each)
                </p>

                <input
                  ref={fileInputRef}
                  type='file'
                  multiple
                  onChange={e => handleFileSelect(e.target.files)}
                  className='hidden'
                  disabled={isSubmitting}
                />
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className='space-y-2'>
                  <p className='text-sm font-medium'>Selected Files:</p>
                  <div className='space-y-1'>
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between p-2 border rounded bg-muted/50'
                      >
                        <div className='flex items-center gap-2'>
                          <span className='text-lg'>
                            {getFileIcon(file.type)}
                          </span>
                          <span className='text-sm'>{file.name}</span>
                          <Badge variant='secondary' className='text-xs'>
                            {formatFileSize(file.size)}
                          </Badge>
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => removeFile(index)}
                          className='h-6 w-6 p-0'
                          disabled={isSubmitting}
                        >
                          <X className='h-3 w-3' />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={closeCreateDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Creating...
                  </>
                ) : (
                  'Create Note'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>Update the note content</DialogDescription>
          </DialogHeader>
          <form action={handleUpdateNote} className='space-y-4'>
            <div className='space-y-2'>
              <label htmlFor='edit-content' className='text-sm font-medium'>
                Content *
              </label>
              <Textarea
                id='edit-content'
                name='content'
                placeholder='Write your note here...'
                rows={6}
                defaultValue={editingNote?.content}
                required
                disabled={isSubmitting}
              />
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={closeEditDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Updating...
                  </>
                ) : (
                  'Update Note'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={closeLightbox}>
        <DialogContent className='max-h-[90vh] p-0 bg-transparent border-none'>
          <VisuallyHidden>
            <DialogTitle>Image Preview</DialogTitle>
          </VisuallyHidden>
          <div className='relative w-full h-full flex items-center justify-center'>
            {lightboxImage && (
              <Image
                src={lightboxImage.src}
                alt={lightboxImage.alt}
                width={1200}
                height={800}
                className='max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl'
                priority
              />
            )}
            <Button
              variant='ghost'
              size='sm'
              onClick={closeLightbox}
              className='absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white h-8 w-8 p-0'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
