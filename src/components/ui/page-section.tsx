import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageSectionProps {
  header?: ReactNode
  children: ReactNode
  className?: string
  variant?: 'default' | 'bordered'
}

export function PageSection({
  header,
  children,
  className = '',
  variant = 'default',
}: PageSectionProps) {
  return (
    <div
      className={cn(
        'page-section',
        variant === 'bordered' && 'border border-muted rounded-lg p-6',
        className
      )}
    >
      {header}
      {children}
    </div>
  )
}
