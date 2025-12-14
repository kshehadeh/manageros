import * as React from 'react'
import { Link } from '@/components/ui/link'
import { cn } from '@/lib/utils'

interface SectionHeaderActionLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
  title?: string
}

/**
 * A link-styled action component for use in SectionHeader action slots.
 * Designed to fit well within the section header without overlapping borders.
 *
 * For client components that need onClick, use a regular button with the same styles.
 * Icons should be passed as children to avoid Server/Client component boundary issues.
 *
 * @example
 * // In a server component:
 * <SectionHeaderAction href="/initiatives">
 *   <Eye className='w-3.5 h-3.5' />
 *   View All
 * </SectionHeaderAction>
 */
export function SectionHeaderAction({
  href,
  children,
  className,
  disabled = false,
  title,
}: SectionHeaderActionLinkProps) {
  const baseStyles = cn(
    'inline-flex items-center gap-1 text-sm text-muted-foreground',
    'hover:text-foreground transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    disabled && 'opacity-50 pointer-events-none',
    className
  )

  return (
    <Link
      href={href}
      className={baseStyles}
      title={title}
      aria-disabled={disabled}
    >
      {children}
    </Link>
  )
}
