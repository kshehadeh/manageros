import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageSectionProps {
  header?: ReactNode
  children: ReactNode
  className?: string
}

export function PageSection({
  header,
  children,
  className = '',
}: PageSectionProps) {
  const hasHeader = !!header

  return (
    <div className={cn('flex flex-col', className)}>
      {header}
      <div className={cn('flex-1', hasHeader && 'pt-md')}>{children}</div>
    </div>
  )
}
