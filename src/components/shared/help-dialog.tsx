'use client'

import { LucideIcon } from 'lucide-react'
import { useEffect } from 'react'

export interface HelpDialogProps {
  /** The ID of the help content to display - redirects to help.mpath.dev */
  helpId: string
  /** Custom icon to display in the header (defaults to HelpCircle) */
  icon?: LucideIcon
  /** Optional custom className for styling */
  className?: string
  /** Whether the dialog is open */
  isOpen: boolean
  /** Callback when the dialog should close */
  onOpenChange: (_open: boolean) => void
}

/**
 * Constructs the help URL for Mintlify documentation
 */
function getHelpUrl(helpId: string): string {
  return `https://help.mpath.dev/${helpId}`
}

/**
 * HelpDialog component that redirects to Mintlify documentation
 * Note: This component now redirects to help.mpath.dev instead of displaying content inline
 */
export function HelpDialog({ helpId, isOpen, onOpenChange }: HelpDialogProps) {
  const helpUrl = getHelpUrl(helpId)

  useEffect(() => {
    if (isOpen) {
      // Redirect to Mintlify documentation
      window.open(helpUrl, '_blank', 'noopener,noreferrer')
      // Close the dialog after opening the link
      onOpenChange(false)
    }
  }, [isOpen, helpUrl, onOpenChange])

  // Return null since we're redirecting
  return null
}
