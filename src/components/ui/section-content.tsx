import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionContentProps {
  children: ReactNode
  className?: string
}

export function SectionContent({
  children,
  className = '',
}: SectionContentProps) {
  return <div className={cn('section-content', className)}>{children}</div>
}
