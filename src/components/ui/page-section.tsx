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
          'border border-muted rounded-sm p-6',
        variant === 'bordered' && hasHeader && 'border border-muted rounded-sm',
        className
      )}
    >
      {header}
      {hasHeader ? (
        <div className='px-2 pb-4 md:px-6 md:pb-6'>{children}</div>
      ) : (
        children
      )}
    </div>
  )
}
