'use client'

import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import { HELP_IDS, getHelpUrl } from '@/lib/help'

export function GettingStartedButton() {
  const handleClick = () => {
    window.open(
      getHelpUrl(HELP_IDS.quickstart),
      '_blank',
      'noopener,noreferrer'
    )
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
