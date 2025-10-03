'use client'

import ReactMarkdown from 'react-markdown'
import { HelpCircle, X, LucideIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { getHelpContent } from '@/lib/help-content-loader'
import { cn } from '@/lib/utils'

export interface HelpDialogProps {
  /** The ID of the help content to display */
  helpId: string
  /** Custom icon to display in the header (defaults to HelpCircle) */
  icon?: LucideIcon
  /** Optional custom className for styling */
  className?: string
  /** Whether the dialog is open */
  isOpen: boolean
  /** Callback when the dialog should close */
  onOpenChange: (_open: boolean) => void
}

/**
 * Unified HelpDialog component for consistent help modal experience across the app
 * Handles help content loading, markdown rendering, and consistent layout
 */
export function HelpDialog({
  helpId,
  icon: Icon = HelpCircle,
  className,
  isOpen,
  onOpenChange,
}: HelpDialogProps) {
  const helpContent = getHelpContent(helpId)

  if (!helpContent) {
    console.warn(`Help content not found for ID: ${helpId}`)
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn('max-w-2xl max-h-[80vh] flex flex-col p-0', className)}
      >
        {/* Sticky Header */}
        <div className='sticky top-0 z-10 bg-background border-b px-6 py-4 rounded-t-lg'>
          <DialogHeader className='pb-0'>
            <div className='flex items-center justify-between'>
              <DialogTitle className='flex items-center gap-2'>
                <Icon className='h-5 w-5 text-muted-foreground' />
                {helpContent.title}
                {helpContent.category && (
                  <span className='text-sm font-normal text-muted-foreground'>
                    • {helpContent.category}
                  </span>
                )}
              </DialogTitle>
              <DialogClose className='rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground'>
                <X className='h-4 w-4' />
                <span className='sr-only'>Close</span>
              </DialogClose>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className='flex-1 overflow-y-auto px-6 pb-6'>
          <div className='prose prose-sm max-w-none dark:prose-invert'>
            <ReactMarkdown
              components={{
                // Customize markdown rendering for better styling
                h1: ({ children }) => (
                  <h1 className='text-lg font-semibold mb-3 text-foreground'>
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className='text-base font-semibold mb-2 mt-4 text-foreground'>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className='text-sm font-semibold mb-2 mt-3 text-foreground'>
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className='mb-3 text-sm leading-relaxed text-muted-foreground'>
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className='mb-3 ml-4 list-disc space-y-1 text-sm text-muted-foreground'>
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className='mb-3 ml-4 list-decimal space-y-1 text-sm text-muted-foreground'>
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className='text-sm text-muted-foreground'>{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className='font-semibold text-foreground'>
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className='italic text-foreground'>{children}</em>
                ),
                code: ({ children }) => (
                  <code className='bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground'>
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className='bg-muted p-3 rounded-md overflow-x-auto text-xs font-mono text-foreground'>
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className='border-l-4 border-muted-foreground/20 pl-4 italic text-muted-foreground'>
                    {children}
                  </blockquote>
                ),
              }}
            >
              {helpContent.content}
            </ReactMarkdown>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
