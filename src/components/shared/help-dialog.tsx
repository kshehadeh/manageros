'use client'

import ReactMarkdown from 'react-markdown'
import { HelpCircle, LucideIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
        className={cn(
          'max-w-[95vw] sm:max-w-[50vw] sm:max-h-[90vh] flex flex-col',
          className
        )}
      >
        <DialogHeader>
          <DialogTitle className='flex items-center gap-md'>
            <Icon className='h-5 w-5 text-muted-foreground' />
            {helpContent.title}
            {helpContent.category && (
              <span className='text-sm font-normal text-muted-foreground'>
                • {helpContent.category}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className='flex-1 overflow-y-auto -mx-2xl px-2xl'>
          <div className='prose prose-sm max-w-none dark:prose-invert'>
            <ReactMarkdown
              components={{
                // Customize markdown rendering for better styling
                h1: ({ children }) => (
                  <h1 className='text-lg font-semibold mb-lg text-foreground'>
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className='text-base font-semibold mb-md mt-xl text-foreground'>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className='text-sm font-semibold mb-md mt-lg text-foreground'>
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className='mb-lg text-sm leading-relaxed text-muted-foreground'>
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className='mb-lg ml-xl list-disc space-y-sm text-sm text-muted-foreground'>
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className='mb-lg ml-xl list-decimal space-y-sm text-sm text-muted-foreground'>
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
                  <code className='bg-muted px-md py-xs rounded text-xs font-mono text-foreground'>
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className='bg-muted p-lg rounded-md overflow-x-auto text-xs font-mono text-foreground'>
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className='border-l-4 border-muted-foreground/20 pl-xl italic text-muted-foreground'>
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
