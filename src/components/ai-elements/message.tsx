'use client'

import { cn } from '@/lib/utils'
import type { UIMessage } from 'ai'
import type { HTMLAttributes } from 'react'
import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { ExternalLink } from '@/components/ui/link'

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role']
}

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      'group flex w-full max-w-[95%] flex-col gap-2',
      from === 'user' ? 'is-user ml-auto justify-end' : 'is-assistant',
      className
    )}
    {...props}
  />
)

export type MessageContentProps = HTMLAttributes<HTMLDivElement>

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      'is-user:dark flex w-fit max-w-full min-w-0 flex-col gap-2 overflow-hidden text-sm',
      'group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:bg-secondary group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-foreground',
      'group-[.is-assistant]:text-foreground',
      className
    )}
    {...props}
  >
    {children}
  </div>
)

export type MessageResponseProps = {
  children: string
  className?: string
}

/**
 * Ensures a URL is relative by removing any protocol/host/domain
 * and ensuring it starts with a forward slash
 */
function ensureRelativeUrl(url: string): string {
  try {
    // If it's already a relative URL (starts with /), return as-is
    if (url.startsWith('/')) {
      return url
    }

    // If it's an absolute URL, extract the pathname
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const urlObj = new URL(url)
      return urlObj.pathname + urlObj.search
    }

    // If it doesn't start with /, add it
    return url.startsWith('/') ? url : `/${url}`
  } catch {
    // If URL parsing fails, ensure it starts with /
    return url.startsWith('/') ? url : `/${url}`
  }
}

export const MessageResponse = memo(
  ({ className, children, ...props }: MessageResponseProps) => {
    if (!children) return null

    return (
      <div
        className={cn(
          'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
          className
        )}
        {...props}
      >
        <ReactMarkdown
          components={{
            // Headings
            h1: ({ children }) => (
              <h1 className='text-lg font-semibold mb-2 mt-3'>{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className='text-base font-semibold mb-2 mt-3'>{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className='text-sm font-semibold mb-1 mt-2'>{children}</h3>
            ),

            // Paragraphs
            p: ({ children }) => (
              <p className='mb-2 text-sm leading-relaxed'>{children}</p>
            ),

            // Lists
            ul: ({ children }) => (
              <ul className='mb-2 ml-4 list-disc space-y-1 text-sm'>
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className='mb-2 ml-4 list-decimal space-y-1 text-sm'>
                {children}
              </ol>
            ),
            li: ({ children }) => <li className='text-sm'>{children}</li>,

            // Text formatting
            strong: ({ children }) => (
              <strong className='font-semibold'>{children}</strong>
            ),
            em: ({ children }) => <em className='italic'>{children}</em>,

            // Code
            code: ({ children }) => (
              <code className='bg-accent px-1.5 py-0.5 rounded text-xs font-mono'>
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className='bg-accent p-2 rounded-md overflow-x-auto mb-2 text-xs font-mono'>
                {children}
              </pre>
            ),

            // Blockquotes
            blockquote: ({ children }) => (
              <blockquote className='border-l-2 border-border pl-3 italic mb-2'>
                {children}
              </blockquote>
            ),

            // Links - use Next.js Link for relative URLs, ExternalLink for absolute URLs
            a: ({ children, href }) => {
              if (!href) {
                return <span>{children}</span>
              }

              // Check if original URL is absolute (starts with http:// or https://)
              const isAbsolute =
                href.startsWith('http://') || href.startsWith('https://')

              if (isAbsolute) {
                // For absolute URLs, use ExternalLink (opens in new tab)
                return (
                  <ExternalLink
                    href={href}
                    className='text-primary underline hover:text-highlight'
                  >
                    {children}
                  </ExternalLink>
                )
              } else {
                // For relative URLs, normalize and use Next.js Link (same page navigation)
                const normalizedUrl = ensureRelativeUrl(href)
                return (
                  <Link
                    href={normalizedUrl}
                    className='text-primary underline hover:text-highlight'
                  >
                    {children}
                  </Link>
                )
              }
            },

            // Horizontal rule
            hr: () => <hr className='border-border my-2' />,
          }}
        >
          {children}
        </ReactMarkdown>
      </div>
    )
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
)

MessageResponse.displayName = 'MessageResponse'
