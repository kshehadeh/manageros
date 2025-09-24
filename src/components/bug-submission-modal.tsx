'use client'

import { useState } from 'react'
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
import { Bug, Loader2 } from 'lucide-react'

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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in both title and description')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await submitGitHubIssue({
        title: title.trim(),
        description: description.trim(),
        includeEmail,
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

          <div className='flex items-center space-x-2'>
            <Checkbox
              id='include-email'
              checked={includeEmail}
              onCheckedChange={setIncludeEmail}
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
