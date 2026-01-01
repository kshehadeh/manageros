import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageTitle } from './page-title'
import { HelpId } from '@/lib/help'

interface PageHeaderProps {
  title?: string | ReactNode
  titleIcon?: LucideIcon | React.ElementType
  iconComponent?: ReactNode
  helpId?: HelpId
  subtitle?: string | ReactNode
  actions?: ReactNode
  className?: string
}

function formatTitle(title: string | ReactNode): ReactNode {
  if (typeof title === 'string') {
    return (
      <>
        <span className='bracket-open'>[</span>
        <span className='text-highlight'>{title}</span>
        <span className='bracket-close'>]</span>
      </>
    )
  }
  return title
}

function renderSubtitle(subtitle: string | ReactNode) {
  if (!subtitle) return null
  return (
    <div className='text-muted-foreground text-sm mt-sm'>
      {typeof subtitle === 'string' ? <p>{subtitle}</p> : subtitle}
    </div>
  )
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
  // When there's an iconComponent, we want the subtitle to be to the right of the icon
  // aligned with the title, not below the entire title block
  const hasIcon = iconComponent || TitleIcon
  const shouldRenderIconSeparately = hasIcon && subtitle

  const titleContent = (
    <div
      className={cn(
        'flex flex-col gap-lg',
        shouldRenderIconSeparately && 'flex-1'
      )}
    >
      {title && (
        <PageTitle
          icon={shouldRenderIconSeparately ? undefined : TitleIcon}
          iconComponent={shouldRenderIconSeparately ? undefined : iconComponent}
          helpId={helpId}
          className={shouldRenderIconSeparately ? 'm-0 leading-tight' : 'mb-md'}
        >
          {formatTitle(title)}
        </PageTitle>
      )}
      {renderSubtitle(subtitle)}
    </div>
  )

  return (
    <div className={cn('mb-lg', className)}>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          {shouldRenderIconSeparately ? (
            <div className='flex gap-lg items-start'>
              {iconComponent ? (
                <div className='flex items-start'>{iconComponent}</div>
              ) : TitleIcon ? (
                <TitleIcon className='h-4 w-4 text-muted-foreground hidden md:block flex-shrink-0 mt-sm' />
              ) : null}
              {titleContent}
            </div>
          ) : (
            titleContent
          )}
        </div>
        {actions && <div className='flex items-center gap-md'>{actions}</div>}
      </div>
    </div>
  )
}
