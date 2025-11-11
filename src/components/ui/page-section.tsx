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
  const hasHeader = !!header

  return (
    <div
      className={cn(
        'page-section',
        variant === 'bordered' &&
          !hasHeader &&
          'border border-muted rounded-sm p-2xl',
        variant === 'bordered' && hasHeader && 'border border-muted rounded-sm',
        className
      )}
    >
      {header}
      {hasHeader ? (
        <div
          className={cn(
            variant === 'bordered' && 'px-md pb-xl md:px-2xl md:pb-2xl'
          )}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}
