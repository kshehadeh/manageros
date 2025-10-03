'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import { HelpDialog } from '@/components/shared'
import { getHelpContent } from '@/lib/help-content-loader'

export function GettingStartedButton() {
  const [isOpen, setIsOpen] = useState(false)
  const help = getHelpContent('getting-started')

  if (!help) return null

  return (
    <>
      <Button
        variant='outline'
        size='sm'
        onClick={() => setIsOpen(true)}
        className='flex items-center justify-center'
        title='Getting Started'
        aria-label='Getting Started'
      >
        <BookOpen className='h-4 w-4' />
      </Button>

      <HelpDialog
        helpId='getting-started'
        icon={BookOpen}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  )
}
