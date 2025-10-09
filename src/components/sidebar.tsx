'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSession, signOut } from 'next-auth/react'
import { signOutWithCleanup } from '@/lib/auth-utils'
import { usePathname } from 'next/navigation'
import { useMobileMenu } from '@/components/mobile-menu-provider'
import { IndigoIcon } from '@/components/indigo-icon'
import type { User as NextAuthUser } from 'next-auth'
import {
  Home,
  Rocket,
  User,
  Users2,
  ListTodo,
  Settings,
  Calendar,
  Building,
  Keyboard,
  BarChart3,
  Command,
  Bot,
} from 'lucide-react'
import { useState } from 'react'
import { HelpDialog } from '@/components/shared'
import { useAIChat } from '@/components/ai-chat-provider'
import { APP_VERSION } from '@/lib/version'

interface NavItem {
  name: string
  href: string
  icon: string
  adminOnly?: boolean
}

interface SidebarProps {
  navigation?: NavItem[]
  serverSession?: NextAuthUser | null
}

const iconMap = {
  Home,
  Rocket,
  User,
  Users2,
  ListTodo,
  Settings,
  Calendar,
  Building,
  BarChart3,
}

export default function Sidebar({
  navigation = [],
  serverSession,
}: SidebarProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu()
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false)
  const { toggleAIChat } = useAIChat()

  // Use server session if available, otherwise fall back to client session
  const effectiveSession = serverSession || session

  // Only show loading if we don't have a server session and client session is loading
  if (status === 'loading' && !serverSession) {
    return (
      <div className='hidden lg:flex h-screen w-64 flex-col bg-card border-r'>
        <div className='flex h-16 items-center px-6'>
          <div className='flex items-center gap-3'>
            <IndigoIcon width={32} height={26} color='currentColor' />
            <h1 className='text-xl font-semibold text-foreground'>ManagerOS</h1>
          </div>
        </div>
        <div className='flex-1 px-6 py-4'>
          <div className='text-sm text-muted-foreground'>Loading...</div>
        </div>
        {/* Version Footer */}
        <div className='px-3 py-2 border-t'>
          <div className='text-xs text-muted-foreground text-center'>
            v{APP_VERSION}
          </div>
        </div>
      </div>
    )
  }

  if (!effectiveSession) {
    return (
      <div className='hidden lg:flex h-screen w-64 flex-col bg-card border-r'>
        <div className='flex h-16 items-center px-6'>
          <div className='flex items-center gap-3'>
            <IndigoIcon width={32} height={26} color='currentColor' />
            <h1 className='text-xl font-semibold text-foreground'>ManagerOS</h1>
          </div>
        </div>
        <div className='flex-1 px-6 py-4'>
          <nav className='space-y-2'>
            <Button asChild variant='outline' className='w-full justify-start'>
              <Link href='/auth/signin'>Sign In</Link>
            </Button>
            <Button asChild variant='outline' className='w-full justify-start'>
              <Link href='/auth/signup'>Sign Up</Link>
            </Button>
          </nav>
        </div>
        {/* Version Footer */}
        <div className='px-3 py-2 border-t'>
          <div className='text-xs text-muted-foreground text-center'>
            v{APP_VERSION}
          </div>
        </div>
      </div>
    )
  }

  // Use the navigation passed from server-side filtering
  const filteredNavigation = navigation

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className='lg:hidden fixed inset-0 bg-black/50 z-40'
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out sidebar-scroll overflow-y-auto ${
          isMobileMenuOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className='flex h-16 items-center px-6 border-b'>
          <div className='flex items-center gap-3'>
            <IndigoIcon width={40} height={33} color='currentColor' />
            <h1 className='text-xl font-semibold text-foreground'>ManagerOS</h1>
          </div>
        </div>

        {/* User Info */}
        <div className='px-6 py-4 border-b'>
          <div className='text-sm text-foreground font-medium'>
            {serverSession?.name || session?.user?.name}
          </div>
          {serverSession?.organizationName ||
          session?.user?.organizationName ? (
            <>
              <div className='text-xs text-muted-foreground'>
                {serverSession?.organizationName ||
                  session?.user?.organizationName}
              </div>
              <div className='text-xs text-muted-foreground'>
                {serverSession?.role || session?.user?.role}
              </div>
            </>
          ) : (
            <div className='text-xs text-muted-foreground'>No organization</div>
          )}
        </div>

        {/* Navigation */}
        <nav className='flex-1 px-3 py-4 space-y-1'>
          {filteredNavigation.map(item => {
            const isActive = pathname === item.href
            const IconComponent = iconMap[item.icon as keyof typeof iconMap]
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'bg-secondary text-secondary-foreground border'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {IconComponent && <IconComponent className='h-5 w-5' />}
                {item.name}
              </Link>
            )
          })}

          {/* AI Chat Button */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false)
              toggleAIChat()
            }}
            className='flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors w-full'
          >
            <Bot className='h-5 w-5' />
            <span>AI Chat</span>
          </button>
        </nav>

        {/* Sign Out */}
        <div className='px-3 py-4 border-t space-y-1'>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false)
              setIsKeyboardShortcutsOpen(true)
            }}
            className='flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors w-full'
          >
            <Keyboard className='h-5 w-5' />
            <span>Keyboard Shortcuts</span>
          </button>
          <button
            onClick={async () => {
              setIsMobileMenuOpen(false)
              await signOutWithCleanup()
              signOut({ callbackUrl: '/auth/signin' })
            }}
            className='flex items-center gap-3 px-3 py-2 text-sm text-badge-error-text hover:text-badge-error-text hover:bg-badge-error/20 rounded-lg transition-colors w-full'
          >
            <svg
              className='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth={1.5}
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75'
              />
            </svg>
            Sign Out
          </button>
        </div>

        {/* Version Footer */}
        <div className='px-3 py-2 border-t'>
          <div className='text-xs text-muted-foreground text-center'>
            v{APP_VERSION}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <HelpDialog
        helpId='keyboard-shortcuts'
        icon={Command}
        isOpen={isKeyboardShortcutsOpen}
        onOpenChange={setIsKeyboardShortcutsOpen}
      />
    </>
  )
}
