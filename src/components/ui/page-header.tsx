import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title?: string | ReactNode
  titleIcon?: LucideIcon | React.ElementType
  subtitle?: string | ReactNode
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  titleIcon: TitleIcon,
  subtitle,
  actions,
  children,
  className = '',
}: PageHeaderProps) {
  // If children are provided, use them directly for maximum flexibility
  // Note: When using children, include actions within the children if needed
  if (children) {
    return <div className={cn('page-header', className)}>{children}</div>
  }

  return (
    <div className={cn('page-header', className)}>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          {title && (
            <div className='flex items-center gap-3 mb-2'>
              {TitleIcon && (
                <TitleIcon className='h-6 w-6 text-muted-foreground hidden md:block' />
              )}
              {typeof title === 'string' ? (
                <h1 className='page-title'>{title}</h1>
              ) : (
                title
              )}
            </div>
          )}
          {subtitle && (
            <div className='page-section-subtitle'>
              {typeof subtitle === 'string' ? <p>{subtitle}</p> : subtitle}
            </div>
          )}
        </div>
        {actions && <div className='flex items-center gap-2'>{actions}</div>}
      </div>
    </div>
  )
}
