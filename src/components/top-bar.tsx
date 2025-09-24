'use client'

import Breadcrumb from './breadcrumb'
import { ModeToggle } from '@/components/mode-toggle'
import { BugReportButton } from '@/components/bug-report-button'
import { Menu, X } from 'lucide-react'
import { useMobileMenu } from '@/components/mobile-menu-provider'

export default function TopBar() {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu()

  return (
    <header className='h-16 bg-card text-card-foreground border-b px-6 flex items-center'>
      <div className='flex w-full items-center justify-between'>
        <div className='flex items-center gap-4'>
          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='lg:hidden p-2 bg-secondary border rounded-lg text-secondary-foreground hover:bg-secondary/80 transition-colors'
          >
            {isMobileMenuOpen ? (
              <X className='h-5 w-5' />
            ) : (
              <Menu className='h-5 w-5' />
            )}
          </button>
          <Breadcrumb />
        </div>
        <div className='flex items-center gap-2'>
          <BugReportButton />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
