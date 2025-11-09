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
  description?: string
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
        <div className='flex items-center gap-2'>
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
      className={`flex items-center justify-between md:mx-0 md:px-2 ${className} mb-2 bg-card p-2 rounded-[var(--radius-md)]`}
    >
      <div className='flex-1'>
        <h3
          className={`text-xl font-bold flex items-center gap-2 ${geistMono.className}`}
        >
          <Icon className='w-6 h-6' />
          {title}
        </h3>
        {description && (
          <p className='text-sm text-muted-foreground mt-1'>{description}</p>
        )}
      </div>
      {renderActions()}
    </div>
  )
}
