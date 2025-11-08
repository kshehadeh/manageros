import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageTitle } from './page-title'

interface PageHeaderProps {
  title?: string | ReactNode
  titleIcon?: LucideIcon | React.ElementType
  iconComponent?: ReactNode
  helpId?: string
  subtitle?: string | ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  titleIcon: TitleIcon,
  iconComponent,
  helpId,
  subtitle,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={cn('page-header', className)}>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          {title && (
            <PageTitle
              icon={TitleIcon}
              iconComponent={iconComponent}
              helpId={helpId}
              className='mb-2'
            >
              {title}
            </PageTitle>
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
