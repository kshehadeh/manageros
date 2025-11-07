import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageMainProps {
  children: ReactNode
  className?: string
}

export function PageMain({ children, className = '' }: PageMainProps) {
  return <div className={cn('flex-1 min-w-0', className)}>{children}</div>
}

PageMain.displayName = 'PageMain'
