'use client'

import ReactMarkdown from 'react-markdown'

interface ReadonlyNotesFieldProps {
  content: string
  className?: string
  variant?: 'default' | 'compact' | 'detailed'
  showEmptyState?: boolean
  emptyStateText?: string
}

export function ReadonlyNotesField({
  content,
  className = '',
  variant = 'default',
  showEmptyState = true,
  emptyStateText = 'No notes available',
}: ReadonlyNotesFieldProps) {
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

  return (
    <div className={`${getVariantClasses()} text-foreground ${className}`}>
      <ReactMarkdown
        components={{
          // Paragraphs
          p: ({ children }) => (
            <p className='mb-3 text-foreground leading-relaxed'>{children}</p>
          ),

          // Headings
          h1: ({ children }) => (
            <h1 className='text-lg font-semibold mb-3 mt-4 text-foreground first:mt-0'>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className='text-base font-semibold mb-2 mt-4 text-foreground first:mt-0'>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className='text-sm font-semibold mb-2 mt-3 text-foreground first:mt-0'>
              {children}
            </h3>
          ),

          // Text formatting
          strong: ({ children }) => (
            <strong className='font-semibold text-foreground'>
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className='italic text-muted-foreground'>{children}</em>
          ),

          // Links - automatically detected and styled
          a: ({ href, children }) => (
            <a
              href={href}
              className='text-primary hover:text-primary/90 underline decoration-primary/30 hover:decoration-primary/60 transition-colors'
              target='_blank'
              rel='noopener noreferrer'
            >
              {children}
            </a>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className='list-disc list-inside mb-3 text-foreground space-y-1'>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className='list-decimal list-inside mb-3 text-foreground space-y-1'>
              {children}
            </ol>
          ),
          li: ({ children }) => <li className='text-foreground'>{children}</li>,

          // Code
          code: ({ children }) => (
            <code className='bg-accent px-1.5 py-0.5 rounded text-sm font-mono text-foreground'>
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className='bg-accent p-3 rounded-md overflow-x-auto mb-3 text-sm font-mono text-foreground'>
              {children}
            </pre>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className='border-l-4 border-border pl-4 italic text-muted-foreground mb-3'>
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
            <th className='border border-border px-3 py-2 text-left font-semibold text-foreground'>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className='border border-border px-3 py-2 text-foreground'>
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
