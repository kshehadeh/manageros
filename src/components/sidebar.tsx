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
  BarChart3,
  Command,
  Bot,
  CheckSquare,
  Keyboard,
  Bug,
  BookOpen,
} from 'lucide-react'
import { useState } from 'react'
import { HelpDialog } from '@/components/shared'
import { BugSubmissionModal } from '@/components/bug-submission-modal'
import { useAIChat } from '@/components/ai-chat-provider'
import { APP_VERSION } from '@/lib/version'
import { PersonAvatar } from '@/components/people/person-avatar'
import { SidebarSkeleton } from '@/components/sidebar-skeleton'

interface NavItem {
  name: string
  href: string
  icon: string
  adminOnly?: boolean
}

interface SidebarProps {
  navigation?: NavItem[]
  serverSession?: NextAuthUser | null
  personData?: {
    id: string
    name: string
    avatar: string | null
    email: string | null
    role: string | null
    jobRoleId: string | null
    jobRoleTitle: string | null
  } | null
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
  CheckSquare,
}

export default function Sidebar({
  navigation = [],
  serverSession,
  personData,
}: SidebarProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu()
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false)
  const [isGettingStartedOpen, setIsGettingStartedOpen] = useState(false)
  const [isBugOpen, setIsBugOpen] = useState(false)
  const { toggleAIChat } = useAIChat()

  // Use server session if available, otherwise fall back to client session
  const effectiveSession = serverSession || session

  // Only show loading if we don't have a server session and client session is loading
  if (status === 'loading' && !serverSession) {
    return <SidebarSkeleton />
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
          <div className='flex items-start gap-3'>
            {personData ? (
              <PersonAvatar
                name={personData.name}
                avatar={personData.avatar}
                size='sm'
              />
            ) : (
              <div className='h-8 w-8 bg-muted rounded-full flex-shrink-0' />
            )}
            <div className='flex-1 min-w-0'>
              {personData ? (
                <Link href={`/people/${personData.id}`}>
                  <div className='text-sm text-foreground font-medium truncate hover:underline cursor-pointer'>
                    {personData.name}
                  </div>
                </Link>
              ) : (
                <div className='text-sm text-foreground font-medium truncate'>
                  {session?.user?.name}
                </div>
              )}
              {personData?.email || session?.user?.email ? (
                <div className='text-xs text-muted-foreground truncate'>
                  {personData?.email || session?.user?.email}
                </div>
              ) : null}
              <div className='flex items-center gap-2 mt-1'>
                <Link
                  href='/settings'
                  onClick={() => setIsMobileMenuOpen(false)}
                  className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline'
                >
                  <Settings className='h-3 w-3' />
                  <span>Settings</span>
                </Link>
                <span className='text-xs text-muted-foreground'>|</span>
                <button
                  onClick={async () => {
                    setIsMobileMenuOpen(false)
                    await signOutWithCleanup()
                    signOut({ callbackUrl: '/auth/signin' })
                  }}
                  className='text-xs text-muted-foreground hover:text-foreground underline cursor-pointer'
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
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

        {/* Footer Actions */}
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
            onClick={() => {
              setIsMobileMenuOpen(false)
              setIsGettingStartedOpen(true)
            }}
            className='flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors w-full'
          >
            <BookOpen className='h-5 w-5' />
            <span>Help</span>
          </button>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false)
              setIsBugOpen(true)
            }}
            className='flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors w-full'
          >
            <Bug className='h-5 w-5' />
            <span>Report a bug</span>
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
      <HelpDialog
        helpId='getting-started'
        icon={BookOpen}
        isOpen={isGettingStartedOpen}
        onOpenChange={setIsGettingStartedOpen}
      />
      <BugSubmissionModal open={isBugOpen} onOpenChange={setIsBugOpen} />
    </>
  )
}
