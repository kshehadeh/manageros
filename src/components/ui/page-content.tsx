import { ReactNode, Children, isValidElement } from 'react'
import { cn } from '@/lib/utils'

interface PageContentProps {
  children: ReactNode
  className?: string
}

function hasLayoutChildren(children: ReactNode): boolean {
  return Children.toArray(children).some(child => {
    if (isValidElement(child)) {
      const componentType = child.type as {
        displayName?: string
        name?: string
      }
      return (
        componentType?.displayName === 'PageMain' ||
        componentType?.displayName === 'PageSidebar' ||
        componentType?.name === 'PageMain' ||
        componentType?.name === 'PageSidebar'
      )
    }
    return false
  })
}

export function PageContent({ children, className = '' }: PageContentProps) {
  const hasLayout = hasLayoutChildren(children)

  if (hasLayout) {
    return (
      <div className={cn('flex flex-col lg:flex-row gap-3xl', className)}>
        {children}
      </div>
    )
  }

  // When no PageMain/PageSidebar, render children with full width
  return <div className={cn('w-full', className)}>{children}</div>
}
