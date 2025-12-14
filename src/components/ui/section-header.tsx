import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { Geist_Mono as GeistMono } from 'next/font/google'

const geistMono = GeistMono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

interface SectionHeaderProps {
  icon: LucideIcon | React.ElementType
  title: string | ReactNode
  description?: ReactNode
  action?: ReactNode | ReactNode[]
  className?: string
  variant?: 'default' | 'no-background'
}

export function SectionHeader({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  variant = 'default',
}: SectionHeaderProps) {
  const renderActions = () => {
    if (!action) return null

    if (Array.isArray(action)) {
      return (
        <div className='flex items-center gap-md'>
          {action.map((actionItem, index) => (
            <div key={index}>{actionItem}</div>
          ))}
        </div>
      )
    }

    return <div>{action}</div>
  }

  return (
    <div
      className={`flex items-center justify-between md:mx-0 md:px-xs ${className} mb-xs ${
        variant === 'default' ? 'p-xs rounded-sm' : ''
      } border-b border-dotted border-muted-foreground pb-sm`}
    >
      <div className='flex items-center gap-lg'>
        <Icon className='w-4 h-4 shrink-0' />
        <div className='min-w-0'>
          <h3 className={`text-base font-bold ${geistMono.className} mb-0`}>
            {title}
          </h3>
          {description && (
            <div className='text-sm text-muted-foreground mt-0'>
              {description}
            </div>
          )}
        </div>
      </div>
      {renderActions()}
    </div>
  )
}
