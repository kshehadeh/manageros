import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageTitle } from './page-title'
import { HelpId } from '@/lib/help'
import { Geist_Mono as GeistMono } from 'next/font/google'

const geistMono = GeistMono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

interface PageHeaderProps {
  title?: string | ReactNode
  titleIcon?: LucideIcon | React.ElementType
  iconComponent?: ReactNode
  helpId?: HelpId
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
    <div className={cn('mb-lg', className)}>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          {hasIcon && subtitle ? (
            <div className='flex gap-lg items-start'>
              {iconComponent ? (
                <div className='flex items-start'>{iconComponent}</div>
              ) : TitleIcon ? (
                <TitleIcon className='h-4 w-4 text-muted-foreground hidden md:block flex-shrink-0 mt-sm' />
              ) : null}
              <div className='flex-1 flex flex-col'>
                {title && (
                  <div className='flex items-start gap-md'>
                    <h1
                      className={`page-title ${geistMono.className} m-0 leading-tight`}
                    >
                      {typeof title === 'string' ? (
                        <>
                          <span className='bracket-open'>[</span>
                          <span className='text-highlight'>{title}</span>
                          <span className='bracket-close'>]</span>
                        </>
                      ) : (
                        title
                      )}
                    </h1>
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
                  className='mb-md'
                >
                  {typeof title === 'string' ? (
                    <>
                      <span className='bracket-open'>[</span>
                      <span className='text-highlight'>{title}</span>
                      <span className='bracket-close'>]</span>
                    </>
                  ) : (
                    title
                  )}
                </PageTitle>
              )}
              {subtitle && (
                <div className='text-muted-foreground text-sm mt-xs'>
                  {typeof subtitle === 'string' ? <p>{subtitle}</p> : subtitle}
                </div>
              )}
            </>
          )}
        </div>
        {actions && <div className='flex items-center gap-md'>{actions}</div>}
      </div>
    </div>
  )
}
