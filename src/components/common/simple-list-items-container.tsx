import { ReactNode } from 'react'

interface SimpleListItemsContainerProps {
  children: ReactNode
  emptyStateText?: string
  isEmpty?: boolean
  className?: string
  useDividers?: boolean
}

export function SimpleListItemsContainer({
  children,
  emptyStateText,
  isEmpty = false,
  className = '',
  useDividers = true,
}: SimpleListItemsContainerProps) {
  const containerClassName = useDividers ? 'space-y-0 divide-y' : 'space-y-0'

  if (isEmpty && emptyStateText) {
    return (
      <div className={containerClassName}>
        <div className='text-neutral-400 text-sm px-3 py-3'>
          {emptyStateText}
        </div>
      </div>
    )
  }

  return (
    <div className={`${containerClassName} ${className}`.trim()}>
      {children}
    </div>
  )
}
