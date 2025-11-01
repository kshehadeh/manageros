'use client'

import Breadcrumb from './breadcrumb'
import { ModeToggle } from '@/components/mode-toggle'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Bell, Sun, Moon, MoreHorizontal } from 'lucide-react'
import { useTheme } from '@/lib/hooks/use-theme'
import { useRouter } from 'next/navigation'

export default function TopBar() {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu()
  const { toggle } = useCommandPalette()
  const { theme, setTheme } = useTheme()

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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggle}
                  className='hidden md:inline-flex items-center gap-2 px-3 py-2 bg-secondary border rounded-lg text-secondary-foreground hover:bg-secondary/80 transition-colors'
                >
                  <CommandIcon className='h-4 w-4' />
                  <span>Command Palette</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Command Palette (Ctrl/⌘ + K)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Desktop right-side actions */}
          <div className='hidden md:flex items-center gap-2'>
            <NotificationBell />
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
    </header>
  )
}
