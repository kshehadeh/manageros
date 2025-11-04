'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Copy, Check, Loader2 } from 'lucide-react'
import Markdown from 'react-markdown'
import { toast } from 'sonner'

interface FeedbackCampaignSummaryModalProps {
  campaignName: string
  targetPersonName: string
  content: string | null
  isLoading: boolean
  isOpen: boolean
  onClose: () => void
}

export function FeedbackCampaignSummaryModal({
  campaignName,
  targetPersonName,
  content,
  isLoading,
  isOpen,
  onClose,
}: FeedbackCampaignSummaryModalProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      setIsCopied(true)
      toast.success('Summary copied to clipboard')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy summary:', error)
      toast.error('Failed to copy summary')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-full sm:max-w-[50vw] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Sparkles className='w-5 h-5' />
            Feedback Summary: {campaignName}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='text-sm text-muted-foreground'>
            Summary of feedback received for {targetPersonName}
          </div>
          {isLoading ? (
            <div className='flex flex-col items-center justify-center py-12 space-y-4'>
              <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
              <p className='text-sm text-muted-foreground'>
                Generating summary from feedback responses...
              </p>
            </div>
          ) : content ? (
            <div className='prose prose-sm dark:prose-invert max-w-none'>
              <div className='text-sm whitespace-pre-wrap leading-relaxed'>
                <Markdown>{content}</Markdown>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className='flex-col sm:flex-row sm:justify-end gap-2'>
          <Button variant='outline' onClick={onClose}>
            {isLoading ? 'Cancel' : 'Close'}
          </Button>
          {!isLoading && content && (
            <Button
              variant='default'
              onClick={handleCopy}
              className='flex items-center gap-2'
            >
              {isCopied ? (
                <>
                  <Check className='w-4 h-4' />
                  Copied
                </>
              ) : (
                <>
                  <Copy className='w-4 h-4' />
                  Copy
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
