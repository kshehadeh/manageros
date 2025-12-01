import ReactMarkdown from 'react-markdown'
import { ExternalLink } from '@/components/ui/link'

interface HelpMarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Reusable component for rendering help markdown content on pages
 * Uses consistent styling with the marketing theme
 */
export function HelpMarkdownRenderer({
  content,
  className = '',
}: HelpMarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className='text-2xl font-semibold mb-6 mt-8 text-white first:mt-0'>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className='text-xl font-semibold mb-4 mt-8 text-white first:mt-0'>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className='text-lg font-semibold mb-3 mt-6 text-white first:mt-0'>
              {children}
            </h3>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className='mb-4 text-base leading-relaxed text-white/80'>
              {children}
            </p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className='mb-4 ml-6 list-disc space-y-2 text-base text-white/80'>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className='mb-4 ml-6 list-decimal space-y-2 text-base text-white/80'>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className='text-base text-white/80'>{children}</li>
          ),

          // Text formatting
          strong: ({ children }) => (
            <strong className='font-semibold text-white'>{children}</strong>
          ),
          em: ({ children }) => (
            <em className='italic text-white/90'>{children}</em>
          ),

          // Code
          code: ({ children }) => (
            <code className='bg-white/10 px-2 py-1 rounded text-sm font-mono text-white/90'>
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className='bg-white/10 p-4 rounded-md overflow-x-auto mb-4 text-sm font-mono text-white/90'>
              {children}
            </pre>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className='border-l-4 border-white/20 pl-4 italic mb-4 text-white/70'>
              {children}
            </blockquote>
          ),

          // Links
          a: ({ children, href }) => (
            <ExternalLink
              href={href}
              className='text-primary underline hover:text-primary/80'
            >
              {children}
            </ExternalLink>
          ),

          // Horizontal rule
          hr: () => <hr className='border-white/10 my-6' />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
