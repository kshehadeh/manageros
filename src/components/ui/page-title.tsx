import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HelpIcon } from '@/components/help-icon'

interface PageTitleProps {
  children: ReactNode
  icon?: LucideIcon | React.ElementType
  iconComponent?: ReactNode
  helpId?: string
  className?: string
}

export function PageTitle({
  children,
  icon: Icon,
  iconComponent,
  helpId,
  className = '',
}: PageTitleProps) {
  return (
    <div
      className={cn(
        'flex gap-3',
        iconComponent ? 'items-start' : 'items-center',
        className
      )}
    >
      {iconComponent ? (
        <div>{iconComponent}</div>
      ) : Icon ? (
        <Icon className='h-6 w-6 text-muted-foreground hidden md:block' />
      ) : null}
      <h1 className='page-title'>{children}</h1>
      {helpId && <HelpIcon helpId={helpId} size='md' />}
    </div>
  )
}
