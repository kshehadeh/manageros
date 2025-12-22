'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface WidgetCardProps {
  title: string
  titleIcon?: LucideIcon
  children: ReactNode
  minWidth?: string
  className?: string
  onClick?: () => void
}

/**
 * Shared widget card component for dashboard widgets
 * Provides consistent styling across all dashboard widgets
 */
export function WidgetCard({
  title,
  titleIcon: TitleIcon,
  children,
  minWidth,
  className = '',
  onClick,
}: WidgetCardProps) {
  return (
    <Card
      className={cn(
        'bg-card text-card-foreground rounded-sm',
        onClick && 'cursor-pointer hover:bg-accent/50 transition-colors',
        className
      )}
      style={{ minWidth, flex: '0 1 auto' }}
      onClick={onClick}
    >
      <CardHeader className='px-lg py-md pb-3 border-b border-dotted border-border flex items-center justify-center'>
        <CardTitle className='text-sm font-bold font-mono flex items-center justify-center gap-2 text-muted-foreground'>
          {TitleIcon && <TitleIcon className='w-3 h-3 text-muted-foreground' />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className='px-lg pb-md pt-2'>{children}</CardContent>
    </Card>
  )
}
