'use client'

import Breadcrumb from './breadcrumb'
import { ModeToggle } from '@/components/mode-toggle'
import { BugReportButton } from '@/components/bug-report-button'
import { Menu, X, Command as CommandIcon } from 'lucide-react'
import { GettingStartedButton } from '@/components/getting-started-button'
import { useMobileMenu } from '@/components/mobile-menu-provider'
import { useCommandPalette } from '@/components/command-palette/provider'
import { NotificationBell } from '@/components/notifications/notification-bell'

export default function TopBar() {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu()
  const { toggle } = useCommandPalette()

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
          {/* Desktop command palette button */}
          <button
            onClick={toggle}
            className='hidden md:inline-flex items-center gap-2 px-3 py-2 bg-secondary border rounded-lg text-secondary-foreground hover:bg-secondary/80 transition-colors'
            title='Open Command Palette (Ctrl+K / ⌘K)'
          >
            <CommandIcon className='h-4 w-4' />
            <span className='text-sm'>Command</span>
            <span className='ml-2 hidden lg:inline text-xs text-muted-foreground border rounded px-1'>
              Ctrl/⌘ + K
            </span>
          </button>

          {/* Mobile command palette button - icon only */}
          <button
            onClick={toggle}
            className='md:hidden p-2 bg-secondary border rounded-lg text-secondary-foreground hover:bg-secondary/80 transition-colors'
            title='Open Command Palette (Ctrl+K / ⌘K)'
          >
            <CommandIcon className='h-5 w-5' />
          </button>

          <NotificationBell />
          <GettingStartedButton />
          <BugReportButton />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
