'use client'

import { LucideIcon, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { HelpId, getHelpUrl } from '@/lib/help'

export interface HelpLinkProps {
  /** The ID of the help content to display - redirects to help.mpath.dev */
  helpId: HelpId
  /** Custom icon to display (defaults to HelpCircle) */
  icon?: LucideIcon
  /** Optional custom className for styling */
  className?: string
  /** Optional children to render instead of the default icon */
  children?: React.ReactNode
  /** Whether to open in a new tab (defaults to true) */
  openInNewTab?: boolean
}

/**
 * HelpLink component that links to Mintlify documentation
 * Opens help.mpath.dev in a new tab by default
 */
export function HelpLink({
  helpId,
  icon: Icon = HelpCircle,
  className,
  children,
  openInNewTab = true,
}: HelpLinkProps) {
  const helpUrl = getHelpUrl(helpId)

  if (children) {
    return (
      <Link
        href={helpUrl}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        className={className}
      >
        {children}
      </Link>
    )
  }

  return (
    <Link
      href={helpUrl}
      target={openInNewTab ? '_blank' : undefined}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
      className={className}
    >
      <Icon className='h-4 w-4' />
    </Link>
  )
}
