'use client'

import { ReactNode, useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileBottomPanelProps {
  title: string
  children: ReactNode
  className?: string
  defaultExpanded?: boolean
}

export function MobileBottomPanel({
  title,
  children,
  className,
  defaultExpanded = false,
}: MobileBottomPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
        'bg-background border-t border-border shadow-lg',
        'transition-transform duration-300 ease-in-out',
        className
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className='w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors'
        aria-expanded={isExpanded}
        aria-controls='mobile-panel-content'
      >
        <span>{title}</span>
        {isExpanded ? (
          <ChevronDown className='h-4 w-4 text-muted-foreground' />
        ) : (
          <ChevronUp className='h-4 w-4 text-muted-foreground' />
        )}
      </button>
      <div
        id='mobile-panel-content'
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded ? 'max-h-[60vh] overflow-y-auto' : 'max-h-0'
        )}
      >
        <div className='px-4 pb-4'>{children}</div>
      </div>
    </div>
  )
}

MobileBottomPanel.displayName = 'MobileBottomPanel'
