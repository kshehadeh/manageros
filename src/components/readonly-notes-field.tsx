'use client'

import { useState, useRef, useLayoutEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'

interface ReadonlyNotesFieldProps {
  content: string
  className?: string
  variant?: 'default' | 'compact' | 'detailed'
  showEmptyState?: boolean
  emptyStateText?: string
  truncateMode?: boolean
  maxHeight?: string
}

export function ReadonlyNotesField({
  content,
  className = '',
  variant = 'default',
  showEmptyState = true,
  emptyStateText = 'No notes available',
  truncateMode = false,
  maxHeight = '200px',
}: ReadonlyNotesFieldProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showToggle, setShowToggle] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!truncateMode || !contentRef.current) {
      setShowToggle(false)
      return
    }

    const checkHeight = () => {
      const element = contentRef.current
      if (!element) return

      if (isExpanded) {
        // When expanded, always show toggle (to allow collapsing)
        setShowToggle(true)
      } else {
        // When collapsed, check if content exceeds max height
        // Temporarily remove maxHeight to measure full height
        const originalMaxHeight = element.style.maxHeight
        const originalOverflow = element.style.overflow
        element.style.maxHeight = 'none'
        element.style.overflow = 'visible'
        const height = element.scrollHeight
        element.style.maxHeight = originalMaxHeight
        element.style.overflow = originalOverflow

        const maxHeightValue = parseInt(maxHeight)
        const needsTruncation = height > maxHeightValue
        setShowToggle(needsTruncation)
      }
    }

    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(checkHeight)
  }, [truncateMode, content, isExpanded, maxHeight])
  // Handle empty content
  if (!content || content.trim() === '') {
    if (!showEmptyState) return null

    return (
      <div className={`text-muted-foreground italic ${className}`}>
        {emptyStateText}
      </div>
    )
  }

  // Variant-specific styling
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'prose prose-sm max-w-none'
      case 'detailed':
        return 'prose max-w-none'
      default:
        return 'prose prose-sm max-w-none'
    }
  }

  const showFade = truncateMode && !isExpanded && showToggle

  const contentStyle = truncateMode
    ? {
        maxHeight: isExpanded ? 'none' : maxHeight,
        overflow: isExpanded ? 'visible' : 'hidden',
        position: 'relative' as const,
        paddingBottom: !isExpanded && showToggle ? '4.5rem' : undefined,
        ...(showFade && {
          maskImage:
            'linear-gradient(to bottom, black calc(100% - 4rem), transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, black calc(100% - 4rem), transparent 100%)',
        }),
      }
    : {}

  return (
    <div className={className}>
      <div className='relative border border-muted rounded-[var(--radius-sm)] p-4'>
        <div
          ref={contentRef}
          className={`${getVariantClasses()} text-muted-foreground break-words`}
          style={contentStyle}
        >
          <ReactMarkdown
            components={{
              // Paragraphs
              p: ({ children }) => (
                <p className='mb-3 leading-relaxed break-words'>{children}</p>
              ),

              // Headings
              h1: ({ children }) => (
                <h1 className='text-lg font-semibold mb-3 mt-4 first:mt-0'>
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className='text-base font-semibold mb-2 mt-4 first:mt-0'>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className='text-sm font-semibold mb-2 mt-3 first:mt-0'>
                  {children}
                </h3>
              ),

              // Text formatting
              strong: ({ children }) => (
                <strong className='font-semibold'>{children}</strong>
              ),
              em: ({ children }) => <em className='italic'>{children}</em>,

              // Links - automatically detected and styled
              a: ({ href, children }) => (
                <a
                  href={href}
                  className='underline decoration-primary/30 hover:decoration-primary/60 transition-colors break-all'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {children}
                </a>
              ),

              // Lists
              ul: ({ children }) => (
                <ul className='list-disc list-inside mb-3 space-y-1'>
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className='list-decimal list-inside mb-3 space-y-1'>
                  {children}
                </ol>
              ),
              li: ({ children }) => <li>{children}</li>,

              // Code
              code: ({ children }) => (
                <code className='bg-accent px-1.5 py-0.5 rounded text-sm font-mono'>
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className='bg-accent p-3 rounded-md overflow-x-auto mb-3 text-sm font-mono'>
                  {children}
                </pre>
              ),

              // Blockquotes
              blockquote: ({ children }) => (
                <blockquote className='border-l-4 border-border pl-4 italic mb-3'>
                  {children}
                </blockquote>
              ),

              // Horizontal rule
              hr: () => <hr className='border-border my-4' />,

              // Tables
              table: ({ children }) => (
                <div className='overflow-x-auto mb-3'>
                  <table className='min-w-full border-collapse border border-border'>
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className='bg-accent'>{children}</thead>
              ),
              tbody: ({ children }) => <tbody>{children}</tbody>,
              tr: ({ children }) => (
                <tr className='border-b border-border'>{children}</tr>
              ),
              th: ({ children }) => (
                <th className='border border-border px-3 py-2 text-left font-semibold'>
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className='border border-border px-3 py-2'>{children}</td>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        {truncateMode && showToggle && (
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant='outline'
            size='sm'
            className='absolute -bottom-3 left-1/2 -translate-x-1/2'
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </Button>
        )}
      </div>
    </div>
  )
}
