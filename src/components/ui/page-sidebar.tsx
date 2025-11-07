import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageSidebarProps {
  children: ReactNode
  className?: string
}

export function PageSidebar({ children, className = '' }: PageSidebarProps) {
  return (
    <div className={cn('w-full lg:w-80 lg:shrink-0', className)}>
      {children}
    </div>
  )
}
