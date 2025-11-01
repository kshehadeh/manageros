import { ReactNode } from 'react'

interface SimpleListContainerProps {
  children: ReactNode
  className?: string
  withSection?: boolean
}

export function SimpleListContainer({
  children,
  className = '',
  withSection = true,
}: SimpleListContainerProps) {
  if (withSection) {
    return (
      <section
        className={`rounded-xl py-4 -mx-3 px-3 md:mx-0 md:px-4 space-y-4 ${className}`}
      >
        {children}
      </section>
    )
  }

  return <div className={`space-y-0 ${className}`}>{children}</div>
}
