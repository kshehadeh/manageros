import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageTitle } from './page-title'
import { HelpIcon } from '@/components/help-icon'
import { Geist_Mono as GeistMono } from 'next/font/google'

const geistMono = GeistMono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

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
  // When there's an iconComponent, we want the subtitle to be to the right of the icon
  // aligned with the title, not below the entire title block
  const hasIcon = iconComponent || TitleIcon

  return (
    <div className={cn('page-header', className)}>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          {hasIcon && subtitle ? (
            <div className='flex gap-3 items-start'>
              {iconComponent ? (
                <div className='flex items-start'>{iconComponent}</div>
              ) : TitleIcon ? (
                <TitleIcon className='h-6 w-6 text-muted-foreground hidden md:block flex-shrink-0 mt-1' />
              ) : null}
              <div className='flex-1 flex flex-col'>
                {title && (
                  <div className='flex items-start gap-2'>
                    <h1
                      className={`page-title ${geistMono.className} m-0 leading-tight`}
                    >
                      {title}
                    </h1>
                    {helpId && (
                      <HelpIcon
                        helpId={helpId}
                        size='md'
                        className='mt-1 flex-shrink-0'
                      />
                    )}
                  </div>
                )}
                {subtitle && (
                  <div className='page-section-subtitle'>
                    {typeof subtitle === 'string' ? (
                      <p>{subtitle}</p>
                    ) : (
                      subtitle
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
        {actions && <div className='flex items-center gap-2'>{actions}</div>}
      </div>
    </div>
  )
}
