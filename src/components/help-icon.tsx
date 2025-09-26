'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getHelpContent } from '@/lib/help-content-loader'
import { cn } from '@/lib/utils'

interface HelpIconProps {
  /** The ID of the help content to display */
  helpId: string
  /** Optional custom className for styling */
  className?: string
  /** Size of the help icon */
  size?: 'sm' | 'md' | 'lg'
  /** Position of the help icon relative to the content */
  position?:
    | 'inline'
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
  /** Custom tooltip text (overrides help content title) */
  tooltip?: string
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

const positionClasses = {
  inline: '',
  'top-right': 'absolute -top-1 -right-1',
  'top-left': 'absolute -top-1 -left-1',
  'bottom-right': 'absolute -bottom-1 -right-1',
  'bottom-left': 'absolute -bottom-1 -left-1',
}

export function HelpIcon({
  helpId,
  className,
  size = 'md',
  position = 'inline',
  tooltip,
}: HelpIconProps) {
  const [isOpen, setIsOpen] = useState(false)
  const helpContent = getHelpContent(helpId)

  if (!helpContent) {
    console.warn(`Help content not found for ID: ${helpId}`)
    return null
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(true)
  }

  return (
    <>
      <button
        type='button'
        onClick={handleClick}
        className={cn(
          'inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          sizeClasses[size],
          positionClasses[position],
          className
        )}
        aria-label={`Help: ${tooltip || helpContent.title}`}
        title={tooltip || helpContent.title}
      >
        <HelpCircle className='h-full w-full' />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <HelpCircle className='h-5 w-5 text-muted-foreground' />
              {helpContent.title}
              {helpContent.category && (
                <span className='text-sm font-normal text-muted-foreground'>
                  • {helpContent.category}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

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
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * A wrapper component that adds a help icon to any content
 */
interface HelpWrapperProps {
  children: React.ReactNode
  helpId: string
  position?: HelpIconProps['position']
  size?: HelpIconProps['size']
  tooltip?: string
  className?: string
}

export function HelpWrapper({
  children,
  helpId,
  position = 'top-right',
  size = 'sm',
  tooltip,
  className,
}: HelpWrapperProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      <HelpIcon
        helpId={helpId}
        position={position}
        size={size}
        tooltip={tooltip}
      />
    </div>
  )
}
