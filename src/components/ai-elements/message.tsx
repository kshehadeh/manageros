'use client'

import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { FileUIPart, UIMessage } from 'ai'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PaperclipIcon,
  XIcon,
} from 'lucide-react'
import type { ComponentProps, HTMLAttributes, ReactElement } from 'react'
import {
  createContext,
  memo,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
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

export type MessageActionsProps = ComponentProps<'div'>

const MessageActions = ({
  className,
  children,
  ...props
}: MessageActionsProps) => (
  <div className={cn('flex items-center gap-1', className)} {...props}>
    {children}
  </div>
)

export type MessageActionProps = ComponentProps<typeof Button> & {
  tooltip?: string
  label?: string
}

const MessageAction = ({
  tooltip,
  children,
  label,
  variant = 'ghost',
  size = 'icon-sm',
  ...props
}: MessageActionProps) => {
  const button = (
    <Button size={size} type='button' variant={variant} {...props}>
      {children}
      <span className='sr-only'>{label || tooltip}</span>
    </Button>
  )

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}

type MessageBranchContextType = {
  currentBranch: number
  totalBranches: number
  goToPrevious: () => void
  goToNext: () => void
  branches: ReactElement[]
  setBranches: (branches: ReactElement[]) => void
}

const MessageBranchContext = createContext<MessageBranchContextType | null>(
  null
)

const useMessageBranch = () => {
  const context = useContext(MessageBranchContext)

  if (!context) {
    throw new Error(
      'MessageBranch components must be used within MessageBranch'
    )
  }

  return context
}

export type MessageBranchProps = HTMLAttributes<HTMLDivElement> & {
  defaultBranch?: number
  onBranchChange?: (branchIndex: number) => void
}

const MessageBranch = ({
  defaultBranch = 0,
  onBranchChange,
  className,
  ...props
}: MessageBranchProps) => {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch)
  const [branches, setBranches] = useState<ReactElement[]>([])

  const handleBranchChange = (newBranch: number) => {
    setCurrentBranch(newBranch)
    onBranchChange?.(newBranch)
  }

  const goToPrevious = () => {
    const newBranch =
      currentBranch > 0 ? currentBranch - 1 : branches.length - 1
    handleBranchChange(newBranch)
  }

  const goToNext = () => {
    const newBranch =
      currentBranch < branches.length - 1 ? currentBranch + 1 : 0
    handleBranchChange(newBranch)
  }

  const contextValue: MessageBranchContextType = {
    currentBranch,
    totalBranches: branches.length,
    goToPrevious,
    goToNext,
    branches,
    setBranches,
  }

  return (
    <MessageBranchContext.Provider value={contextValue}>
      <div
        className={cn('grid w-full gap-2 [&>div]:pb-0', className)}
        {...props}
      />
    </MessageBranchContext.Provider>
  )
}

export type MessageBranchContentProps = HTMLAttributes<HTMLDivElement>

const MessageBranchContent = ({
  children,
  ...props
}: MessageBranchContentProps) => {
  const { currentBranch, setBranches, branches } = useMessageBranch()
  const childrenArray = useMemo(
    () => (Array.isArray(children) ? children : [children]),
    [children]
  )

  // Use useEffect to update branches when they change
  useEffect(() => {
    if (branches.length !== childrenArray.length) {
      setBranches(childrenArray)
    }
  }, [childrenArray, branches, setBranches])

  return childrenArray.map((branch, index) => (
    <div
      className={cn(
        'grid gap-2 overflow-hidden [&>div]:pb-0',
        index === currentBranch ? 'block' : 'hidden'
      )}
      key={branch.key}
      {...props}
    >
      {branch}
    </div>
  ))
}

export type MessageBranchSelectorProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role']
}

const MessageBranchSelector = ({
  ...props
}: MessageBranchSelectorProps) => {
  const { totalBranches } = useMessageBranch()

  // Don't render if there's only one branch
  if (totalBranches <= 1) {
    return null
  }

  return (
    <ButtonGroup
      className='[&>*:not(:first-child)]:rounded-l-md [&>*:not(:last-child)]:rounded-r-md'
      orientation='horizontal'
      {...props}
    />
  )
}

export type MessageBranchPreviousProps = ComponentProps<typeof Button>

const MessageBranchPrevious = ({
  children,
  ...props
}: MessageBranchPreviousProps) => {
  const { goToPrevious, totalBranches } = useMessageBranch()

  return (
    <Button
      aria-label='Previous branch'
      disabled={totalBranches <= 1}
      onClick={goToPrevious}
      size='icon-sm'
      type='button'
      variant='ghost'
      {...props}
    >
      {children ?? <ChevronLeftIcon size={14} />}
    </Button>
  )
}

export type MessageBranchNextProps = ComponentProps<typeof Button>

const MessageBranchNext = ({
  children,
  ...props
}: MessageBranchNextProps) => {
  const { goToNext, totalBranches } = useMessageBranch()

  return (
    <Button
      aria-label='Next branch'
      disabled={totalBranches <= 1}
      onClick={goToNext}
      size='icon-sm'
      type='button'
      variant='ghost'
      {...props}
    >
      {children ?? <ChevronRightIcon size={14} />}
    </Button>
  )
}

export type MessageBranchPageProps = HTMLAttributes<HTMLSpanElement>

const MessageBranchPage = ({
  className,
  ...props
}: MessageBranchPageProps) => {
  const { currentBranch, totalBranches } = useMessageBranch()

  return (
    <ButtonGroupText
      className={cn(
        'border-none bg-transparent text-muted-foreground shadow-none',
        className
      )}
      {...props}
    >
      {currentBranch + 1} of {totalBranches}
    </ButtonGroupText>
  )
}

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

export type MessageAttachmentProps = HTMLAttributes<HTMLDivElement> & {
  data: FileUIPart
  className?: string
  onRemove?: () => void
}

function MessageAttachment({
  data,
  className,
  onRemove,
  ...props
}: MessageAttachmentProps) {
  const filename = data.filename || ''
  const mediaType =
    data.mediaType?.startsWith('image/') && data.url ? 'image' : 'file'
  const isImage = mediaType === 'image'
  const attachmentLabel = filename || (isImage ? 'Image' : 'Attachment')

  return (
    <div
      className={cn(
        'group relative size-24 overflow-hidden rounded-lg',
        className
      )}
      {...props}
    >
      {isImage ? (
        <>
          <img
            alt={filename || 'attachment'}
            className='size-full object-cover'
            height={100}
            src={data.url}
            width={100}
          />
          {onRemove && (
            <Button
              aria-label='Remove attachment'
              className='absolute top-2 right-2 size-6 rounded-full bg-background/80 p-0 opacity-0 backdrop-blur-sm transition-opacity hover:bg-background group-hover:opacity-100 [&>svg]:size-3'
              onClick={e => {
                e.stopPropagation()
                onRemove()
              }}
              type='button'
              variant='ghost'
            >
              <XIcon />
              <span className='sr-only'>Remove</span>
            </Button>
          )}
        </>
      ) : (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className='flex size-full shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
                <PaperclipIcon className='size-4' />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{attachmentLabel}</p>
            </TooltipContent>
          </Tooltip>
          {onRemove && (
            <Button
              aria-label='Remove attachment'
              className='size-6 shrink-0 rounded-full p-0 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 [&>svg]:size-3'
              onClick={e => {
                e.stopPropagation()
                onRemove()
              }}
              type='button'
              variant='ghost'
            >
              <XIcon />
              <span className='sr-only'>Remove</span>
            </Button>
          )}
        </>
      )}
    </div>
  )
}

export type MessageAttachmentsProps = ComponentProps<'div'>

function MessageAttachments({
  children,
  className,
  ...props
}: MessageAttachmentsProps) {
  if (!children) {
    return null
  }

  return (
    <div
      className={cn(
        'ml-auto flex w-fit flex-wrap items-start gap-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export type MessageToolbarProps = ComponentProps<'div'>

const MessageToolbar = ({
  className,
  children,
  ...props
}: MessageToolbarProps) => (
  <div
    className={cn(
      'mt-4 flex w-full items-center justify-between gap-4',
      className
    )}
    {...props}
  >
    {children}
  </div>
)
