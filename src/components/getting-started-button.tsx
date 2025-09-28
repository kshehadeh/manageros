'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import { BookOpen, X } from 'lucide-react'
import { getHelpContent } from '@/lib/help-content-loader'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'

export function GettingStartedButton() {
  const [isOpen, setIsOpen] = useState(false)
  const help = getHelpContent('getting-started')

  if (!help) return null

  return (
    <>
      <Button
        variant='outline'
        size='sm'
        onClick={() => setIsOpen(true)}
        className='flex items-center gap-2'
        title='Getting Started'
      >
        <BookOpen className='h-4 w-4' />
        <span className='hidden sm:inline'>Getting Started</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='max-w-2xl max-h-[80vh] flex flex-col p-0'>
          {/* Sticky Header */}
          <div className='sticky top-0 z-10 bg-background border-b px-6 py-4 rounded-t-lg'>
            <DialogHeader className='pb-0'>
              <div className='flex items-center justify-between'>
                <DialogTitle className='flex items-center gap-2'>
                  <BookOpen className='h-5 w-5 text-muted-foreground' />
                  {help.title}
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
                    <li className='text-sm text-muted-foreground'>
                      {children}
                    </li>
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
                {help.content}
              </ReactMarkdown>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
