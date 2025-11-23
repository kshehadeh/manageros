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
        'flex flex-col',
        variant === 'bordered' &&
          !hasHeader &&
          'border border-muted rounded-sm p-2xl',
        variant === 'bordered' && hasHeader && 'border border-muted rounded-sm',
        className
      )}
    >
      {header}
      <div
        className={cn(
          'flex-1',
          hasHeader && 'pt-lg',
          variant === 'bordered' &&
            hasHeader &&
            'px-md pb-xl md:px-2xl md:pb-2xl'
        )}
      >
        {children}
      </div>
    </div>
  )
}
