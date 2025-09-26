'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { submitGitHubIssue } from '@/lib/actions'
import { toast } from 'sonner'
import { Bug, Loader2, X, Image as ImageIcon } from 'lucide-react'

interface BugSubmissionModalProps {
  open: boolean
  onOpenChange: (_open: boolean) => void
}

export function BugSubmissionModal({
  open,
  onOpenChange,
}: BugSubmissionModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [includeEmail, setIncludeEmail] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateImage = (file: File): string | null => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ]
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, GIF, and WebP images are allowed'
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return 'Image size must be less than 10MB'
    }

    return null
  }

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return

    const newImages: File[] = []
    const errors: string[] = []

    Array.from(files).forEach(file => {
      const error = validateImage(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        newImages.push(file)
      }
    })

    if (errors.length > 0) {
      toast.error(errors.join('\n'))
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
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

    const files = e.dataTransfer.files
    handleImageSelect(files)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in both title and description')
      return
    }

    setIsSubmitting(true)

    try {
      // For now, we'll skip image uploads since uploadImageToR2 is not implemented
      const result = await submitGitHubIssue({
        title: title.trim(),
        description: description.trim(),
        includeEmail,
        images: undefined, // TODO: Implement image upload
      })

      if (result.success) {
        toast.success(`Bug report submitted successfully!`, {
          description: (
            <div className='mt-2'>
              <p>
                Issue #{result.issueNumber}: {result.issueTitle}
              </p>
              <a
                href={result.issueUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:text-blue-800 underline'
              >
                View on GitHub →
              </a>
            </div>
          ),
          duration: 8000,
        })

        // Reset form
        setTitle('')
        setDescription('')
        setIncludeEmail(false)
        setImages([])
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error submitting bug report:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit bug report'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setTitle('')
    setDescription('')
    setIncludeEmail(false)
    setImages([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Bug className='h-5 w-5 text-red-500' />
            Report a Bug
          </DialogTitle>
          <DialogDescription>
            Help us improve ManagerOS by reporting bugs or issues you encounter.
            Your report will be submitted to our GitHub repository.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label htmlFor='title' className='text-sm font-medium'>
              Title *
            </label>
            <Input
              id='title'
              placeholder='Brief description of the issue'
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className='space-y-2'>
            <label htmlFor='description' className='text-sm font-medium'>
              Description *
            </label>
            <Textarea
              id='description'
              placeholder='Please describe the issue in detail. Include steps to reproduce, expected behavior, and actual behavior.'
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={6}
              required
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Images (Optional)</label>

            {/* Drag & Drop Area */}
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
              <ImageIcon className='mx-auto h-8 w-8 text-muted-foreground mb-2' />
              <p className='text-sm text-muted-foreground mb-2'>
                Drag & drop images here, or{' '}
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  className='text-primary hover:underline'
                  disabled={isSubmitting}
                >
                  browse files
                </button>
              </p>
              <p className='text-xs text-muted-foreground'>
                Supports JPEG, PNG, GIF, WebP (max 10MB each)
              </p>

              <input
                ref={fileInputRef}
                type='file'
                multiple
                accept='image/*'
                onChange={e => handleImageSelect(e.target.files)}
                className='hidden'
                disabled={isSubmitting}
              />
            </div>

            {/* Image Preview */}
            {images.length > 0 && (
              <div className='space-y-2'>
                <p className='text-sm font-medium'>Selected Images:</p>
                <div className='grid grid-cols-2 gap-2'>
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className='relative group border rounded-lg p-2 bg-muted/50'
                    >
                      <div className='flex items-center gap-2'>
                        <ImageIcon className='h-4 w-4 text-muted-foreground' />
                        <span className='text-xs truncate flex-1'>
                          {image.name}
                        </span>
                        <button
                          type='button'
                          onClick={() => removeImage(index)}
                          className='opacity-0 group-hover:opacity-100 transition-opacity'
                          disabled={isSubmitting}
                        >
                          <X className='h-3 w-3 text-destructive' />
                        </button>
                      </div>
                      <p className='text-xs text-muted-foreground mt-1'>
                        {(image.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className='flex items-center space-x-2'>
            <Checkbox
              id='include-email'
              checked={includeEmail}
              onCheckedChange={value =>
                setIncludeEmail(value === 'indeterminate' ? false : value)
              }
              disabled={isSubmitting}
            />
            <label
              htmlFor='include-email'
              className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            >
              Include my email address in the issue description
            </label>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting || !title.trim() || !description.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Submitting...
                </>
              ) : (
                'Submit Bug Report'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
