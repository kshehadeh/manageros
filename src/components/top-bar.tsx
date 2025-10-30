'use client'

import Breadcrumb from './breadcrumb'
import { ModeToggle } from '@/components/mode-toggle'
import { BugReportButton } from '@/components/bug-report-button'
import { Menu, X, Command as CommandIcon } from 'lucide-react'
import { useMobileMenu } from '@/components/mobile-menu-provider'
import { useCommandPalette } from '@/components/command-palette/provider'
import { NotificationBell } from '@/components/notifications/notification-bell'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Bell, Bug, Sun, Moon, MoreHorizontal } from 'lucide-react'
import { useTheme } from '@/lib/hooks/use-theme'
import { useState } from 'react'
import { BugSubmissionModal } from '@/components/bug-submission-modal'
import { useRouter } from 'next/navigation'

export default function TopBar() {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu()
  const { toggle } = useCommandPalette()
  const { theme, setTheme } = useTheme()
  const [isBugOpen, setIsBugOpen] = useState(false)
  const router = useRouter()

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

          {/* Desktop right-side actions */}
          <div className='hidden md:flex items-center gap-2'>
            <NotificationBell />
            <BugReportButton />
            <ModeToggle />
          </div>

          {/* Mobile consolidated actions dropdown */}
          <div className='md:hidden'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='icon' aria-label='More actions'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-52'>
                <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
                <DropdownMenuItem onSelect={toggle}>
                  <CommandIcon className='h-4 w-4' />
                  <span>Command Palette</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => router.push('/notifications')}
                >
                  <Bell className='h-4 w-4' />
                  <span>Notifications</span>
                </DropdownMenuItem>

                <DropdownMenuItem onSelect={() => setIsBugOpen(true)}>
                  <Bug className='h-4 w-4' />
                  <span>Report a bug</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? (
                    <Sun className='h-4 w-4' />
                  ) : (
                    <Moon className='h-4 w-4' />
                  )}
                  <span>Toggle theme</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {/* Mobile-only modals triggered from dropdown */}
      <BugSubmissionModal open={isBugOpen} onOpenChange={setIsBugOpen} />
    </header>
  )
}
