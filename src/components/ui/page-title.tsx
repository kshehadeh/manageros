import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HelpIcon } from '@/components/help-icon'
import { Geist_Mono as GeistMono } from 'next/font/google'

const geistMono = GeistMono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

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
        'flex gap-lg',
        iconComponent ? 'items-start' : 'items-center',
        className
      )}
    >
      {iconComponent ? (
        <div>{iconComponent}</div>
      ) : Icon ? (
        <Icon className='h-6 w-6 text-muted-foreground hidden md:block' />
      ) : null}
      <h1 className={`page-title ${geistMono.className}`}>{children}</h1>
      {helpId && <HelpIcon helpId={helpId} size='md' />}
    </div>
  )
}
