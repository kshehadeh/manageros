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
import { Sparkles, Copy, Check } from 'lucide-react'
import Markdown from 'react-markdown'
import { toast } from 'sonner'

interface PersonOverviewDisplayModalProps {
  personName: string
  content: string
  updatedAt: string
  fromDate?: string
  toDate?: string
  lookbackDays?: number
  isOpen: boolean
  onClose: () => void
}

export function PersonOverviewDisplayModal({
  personName,
  content,
  updatedAt,
  fromDate,
  toDate,
  lookbackDays = 30,
  isOpen,
  onClose,
}: PersonOverviewDisplayModalProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setIsCopied(true)
      toast.success('Overview copied to clipboard')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy overview:', error)
      toast.error('Failed to copy overview')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Sparkles className='w-5 h-5' />
            AI Overview: {personName}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='prose prose-sm dark:prose-invert max-w-none'>
            <div className='text-sm whitespace-pre-wrap leading-relaxed'>
              <Markdown>{content}</Markdown>
            </div>
          </div>
        </div>

        <DialogFooter className='flex-col sm:flex-row sm:justify-between sm:items-center gap-2'>
          <div className='text-xs text-muted-foreground'>
            <div>
              Last updated: {new Date(updatedAt).toLocaleDateString()} at{' '}
              {new Date(updatedAt).toLocaleTimeString()}
            </div>
            {fromDate && toDate ? (
              <div>
                Period: {new Date(fromDate).toLocaleDateString()} -{' '}
                {new Date(toDate).toLocaleDateString()} ({lookbackDays} day
                {lookbackDays !== 1 ? 's' : ''})
              </div>
            ) : (
              <div>
                Lookback period: Last {lookbackDays} day
                {lookbackDays !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={onClose}>
              Close
            </Button>
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
