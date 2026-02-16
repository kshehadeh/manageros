'use client'

import { useUser } from '@clerk/nextjs'
import Breadcrumb from './breadcrumb'
import { ModeToggle } from '@/components/mode-toggle'
import { Menu, X, Search } from 'lucide-react'
import { useMobileMenu } from '@/components/mobile-menu-provider'
import { useCommandPalette } from '@/components/command-palette/provider'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { UserBrief } from '../lib/auth-types'
import { Button } from './ui/button'

export default function TopBar() {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu()
  const { toggle } = useCommandPalette()
  const { user } = useUser()

  // Get organization status from Clerk user metadata (no API call needed)
  const hasOrganization = !!(user?.publicMetadata as UserBrief)
    ?.managerOSOrganizationId

  return (
    <header className='h-16 bg-card text-card-foreground border-b px-2xl flex items-center'>
      <div className='flex w-full items-center justify-between'>
        <div className='flex items-center gap-xl'>
          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='lg:hidden p-md bg-secondary border rounded-lg text-secondary-foreground hover:bg-secondary/80 transition-colors'
          >
            {isMobileMenuOpen ? (
              <X className='h-5 w-5' />
            ) : (
              <Menu className='h-5 w-5' />
            )}
          </button>
          {/* Desktop breadcrumb */}
          <div className='hidden @md:block'>
            <Breadcrumb />
          </div>
        </div>
        <div className='flex items-center gap-md'>
          {/* Search organization button - shown on both mobile and desktop */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='secondary'
                  onClick={toggle}
                  className={cn(
                    'flex items-center justify-center gap-sm px-lg py-md',
                    // Use container queries to respond to main content area width
                    // When container is narrow (AI sidebar open), show icon + shortcut only
                    // When container is wider, show text as well
                    '@md:justify-start'
                  )}
                >
                  <Search className='h-4 w-4 shrink-0 text-muted-foreground' />
                  <span className='hidden @lg:inline flex-1 text-left text-sm text-muted-foreground truncate'>
                    Search organization
                  </span>
                  <kbd className='pointer-events-none inline-flex h-5 select-none items-center gap-sm rounded border bg-background px-sm font-mono text-xs font-medium text-foreground shadow-sm shrink-0'>
                    <span className='text-xs'>⌘</span>K
                  </kbd>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Command Palette (Ctrl/⌘ + K)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Desktop right-side actions */}
          <div className='hidden md:flex items-center gap-md'>
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
