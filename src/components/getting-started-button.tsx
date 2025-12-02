'use client'

import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'

/**
 * Constructs the help URL for Mintlify documentation
 */
function getHelpUrl(helpId: string): string {
  return `https://help.mpath.dev/${helpId}`
}

export function GettingStartedButton() {
  const handleClick = () => {
    window.open(getHelpUrl('getting-started'), '_blank', 'noopener,noreferrer')
  }

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={handleClick}
      className='flex items-center justify-center'
      title='Getting Started'
      aria-label='Getting Started'
    >
      <BookOpen className='h-4 w-4' />
    </Button>
  )
}
