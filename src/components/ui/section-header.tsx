import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { Geist_Mono as GeistMono } from 'next/font/google'

const geistMono = GeistMono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

interface SectionHeaderProps {
  icon: LucideIcon | React.ElementType
  title: string
  description?: ReactNode
  action?: ReactNode | ReactNode[]
  className?: string
}

export function SectionHeader({
  icon: Icon,
  title,
  description,
  action,
  className = '',
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
      className={`flex items-start justify-between md:mx-0 md:px-md ${className} mb-md bg-muted p-md`}
    >
      <div className='flex-1 flex items-start gap-md'>
        <Icon className='w-6 h-6 shrink-0 mt-xs' />
        <div className='flex-1 min-w-0'>
          <h3 className={`text-xl font-bold ${geistMono.className}`}>
            {title}
          </h3>
          {description && (
            <div className='text-sm text-muted-foreground mt-sm'>
              {description}
            </div>
          )}
        </div>
      </div>
      {renderActions()}
    </div>
  )
}
