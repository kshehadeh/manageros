'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { HelpCircle } from 'lucide-react'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface WidgetCardProps {
  title: string
  titleIcon?: ReactNode
  children: ReactNode
  minWidth?: string
  className?: string
  onClick?: () => void
  helpText?: string
}

/**
 * Shared widget card component for dashboard widgets
 * Provides consistent styling across all dashboard widgets
 */
export function WidgetCard({
  title,
  titleIcon,
  children,
  minWidth,
  className = '',
  onClick,
  helpText,
}: WidgetCardProps) {
  return (
    <Card
      className={cn(
        'bg-card text-card-foreground rounded-sm',
        onClick && 'cursor-pointer hover:bg-accent/50 transition-colors',
        className
      )}
      style={{ minWidth }}
      onClick={onClick}
    >
      <CardHeader className='px-lg py-md pb-sm border-b border-dotted border-border relative flex flex-row items-center justify-center min-h-[2.5rem]'>
        <CardTitle className='text-sm font-bold font-mono flex items-center gap-2 text-muted-foreground pb-0 mb-0'>
          {titleIcon}
          {title}
        </CardTitle>
        {helpText && (
          <div className='absolute top-1/2 right-lg -translate-y-1/2'>
            <HoverCard openDelay={200} closeDelay={0}>
              <HoverCardTrigger asChild>
                <button
                  type='button'
                  className='inline-flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground transition-colors focus:outline-none p-0.5'
                  onClick={e => e.stopPropagation()}
                  aria-label='Help'
                >
                  <HelpCircle className='w-3 h-3' />
                </button>
              </HoverCardTrigger>
              <HoverCardContent side='top' align='end' sideOffset={6}>
                <p className='text-sm'>{helpText}</p>
              </HoverCardContent>
            </HoverCard>
          </div>
        )}
      </CardHeader>
      <CardContent className='px-lg pb-md pt-2'>{children}</CardContent>
    </Card>
  )
}
