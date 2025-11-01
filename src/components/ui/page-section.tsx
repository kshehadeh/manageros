import { ReactNode } from 'react'

interface PageSectionProps {
  header?: ReactNode
  children: ReactNode
  className?: string
}

export function PageSection({
  header,
  children,
  className = '',
}: PageSectionProps) {
  return (
    <div className={`page-section ${className}`.trim()}>
      {header}
      {children}
    </div>
  )
}
