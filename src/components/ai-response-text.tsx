import ReactMarkdown from 'react-markdown'
import { ExternalLink } from '@/components/ui/link'

interface AiResponseTextProps {
  text: string
}

export function AiResponseText({ text }: AiResponseTextProps) {
  return (
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
          <ul className='mb-2 ml-4 list-disc space-y-1 text-sm'>{children}</ul>
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

        // Links
        a: ({ children, href }) => (
          <ExternalLink href={href} className='text-primary underline'>
            {children}
          </ExternalLink>
        ),

        // Horizontal rule
        hr: () => <hr className='border-border my-2' />,
      }}
    >
      {text}
    </ReactMarkdown>
  )
}
