'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { HelpDialog } from '@/components/shared'
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

      <HelpDialog
        helpId={helpId}
        icon={HelpCircle}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  )
}

/**
 * Wrapper component that adds a help icon to any existing content
 */
export function HelpWrapper({
  children,
  helpId,
  position = 'top-right',
  size = 'md',
}: {
  children: React.ReactNode
  helpId: string
  position?: Exclude<HelpIconProps['position'], 'inline'>
  size?: HelpIconProps['size']
}) {
  return (
    <div className='relative'>
      {children}
      <HelpIcon helpId={helpId} position={position} size={size} />
    </div>
  )
}
