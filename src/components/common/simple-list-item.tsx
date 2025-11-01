import { ReactNode } from 'react'

interface SimpleListItemProps {
  children: ReactNode
  onClick?: () => void
  className?: string
}

export function SimpleListItem({
  children,
  onClick,
  className = '',
}: SimpleListItemProps) {
  const baseClasses =
    'flex items-center justify-between px-3 py-3 hover:bg-muted/50 transition-colors bg-muted/40 rounded-md mb-2 cursor-pointer'

  const combinedClassName = `${baseClasses} ${className}`.trim()

  if (onClick) {
    return (
      <div onClick={onClick} className={combinedClassName}>
        {children}
      </div>
    )
  }

  return <div className={combinedClassName}>{children}</div>
}
