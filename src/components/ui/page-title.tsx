import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageTitleProps {
  children: ReactNode
  icon?: LucideIcon | React.ElementType
  className?: string
}

export function PageTitle({
  children,
  icon: Icon,
  className = '',
}: PageTitleProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {Icon && (
        <Icon className='h-6 w-6 text-muted-foreground hidden md:block' />
      )}
      <h1 className='page-title'>{children}</h1>
    </div>
  )
}
