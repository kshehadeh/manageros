'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { OrganizationProfile, SignedIn } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { Settings } from 'lucide-react'

export function OrganizationProfileButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <SignedIn>
      <Button
        variant='outline'
        onClick={() => setIsOpen(true)}
        className='flex items-center gap-2'
      >
        <Settings className='w-4 h-4' />
        <span className='hidden sm:inline'>Organization Manager</span>
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Organization Manager</DialogTitle>
          </DialogHeader>
          <div className='mt-4'>
            <OrganizationProfile appearance={dark} routing='hash' />
          </div>
        </DialogContent>
      </Dialog>
    </SignedIn>
  )
}
