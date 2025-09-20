'use client'

import Breadcrumb from './breadcrumb'
import { ModeToggle } from '@/components/mode-toggle'

export default function TopBar() {
  return (
    <header className='h-16 bg-card text-card-foreground border-b px-6 flex items-center'>
      <div className='flex w-full items-center justify-between'>
        <Breadcrumb />
        <ModeToggle />
      </div>
    </header>
  )
}
