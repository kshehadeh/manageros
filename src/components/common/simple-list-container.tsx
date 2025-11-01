import { ReactNode } from 'react'

interface SimpleListContainerProps {
  children: ReactNode
  className?: string
}

export function SimpleListContainer({
  children,
  className = '',
}: SimpleListContainerProps) {
  return <div className={`space-y-0 ${className}`}>{children}</div>
}
