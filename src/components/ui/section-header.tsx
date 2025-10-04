import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface SectionHeaderProps {
  icon: LucideIcon | React.ElementType
  title: string
  action?: ReactNode | ReactNode[]
  className?: string
}

export function SectionHeader({
  icon: Icon,
  title,
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
      className={`flex items-center justify-between border-b border-muted pb-3 mb-3 ${className}`}
    >
      <h3 className='font-bold flex items-center gap-2'>
        <Icon className='w-4 h-4' />
        {title}
      </h3>
      {renderActions()}
    </div>
  )
}
