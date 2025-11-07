import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export function PageContainer({
  children,
  className = '',
}: PageContainerProps) {
  return <div className={cn('page-container', className)}>{children}</div>
}
