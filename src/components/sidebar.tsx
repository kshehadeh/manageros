'use client'

import { Link } from '@/components/ui/link'
import { useClerk, useUser } from '@clerk/nextjs'
import { signOutWithCleanup } from '@/lib/auth-client-utils'
import { usePathname } from 'next/navigation'
import { useMobileMenu } from '@/components/mobile-menu-provider'
import { IndigoIcon } from '@/components/indigo-icon'
import type { User as UserType } from '@/lib/auth-types'
import { Geist_Mono as GeistMono } from 'next/font/google'

const geistMono = GeistMono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})
import {
  Home,
  Rocket,
  User as UserIcon,
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
import { Skeleton } from '@/components/ui/skeleton'
import { OrganizationPlanInfo } from '@/components/common/organization-plan-info'
import { PersonBrief } from '../types/person'
interface NavItem {
  name: string
  href: string
  icon: string
  adminOnly?: boolean
  requiresPermission?: string
}

interface SidebarProps {
  navigation?: NavItem[]
  serverSession?: UserType | null
  personData?: PersonBrief | null
}

const iconMap = {
  Home,
  Rocket,
  User: UserIcon,
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
  const { user } = useUser()
  const pathname = usePathname()
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu()
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false)
  const [isGettingStartedOpen, setIsGettingStartedOpen] = useState(false)
  const [isBugOpen, setIsBugOpen] = useState(false)
  const { toggleAIChat } = useAIChat()
  const { signOut } = useClerk()

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
        <div className='flex h-16 items-center px-2xl border-b'>
          <div className='flex items-center gap-lg'>
            <IndigoIcon width={40} height={33} color='currentColor' />
            <h1
              className={`text-xl font-semibold text-foreground ${geistMono.className}`}
            >
              [<span className='text-highlight'>mpath</span>]
            </h1>
          </div>
        </div>

        {/* User Info */}
        <div className='px-2xl py-xl border-b'>
          {serverSession ? (
            <div className='flex items-start gap-lg'>
              {personData ? (
                <PersonAvatar
                  name={personData.name}
                  avatar={personData.avatar}
                  size='sm'
                />
              ) : (
                <PersonAvatar
                  name={user?.firstName || user?.lastName || 'User'}
                  size='sm'
                />
              )}
              <div className={`flex-1 min-w-0 ${geistMono.className}`}>
                {/* Email - only shown if no person is associated */}
                {!personData && (
                  <div className='text-sm text-foreground font-medium truncate'>
                    {serverSession.email
                      ? serverSession.email
                      : user?.emailAddresses[0].emailAddress}
                  </div>
                )}

                {/* Person name - shown if person exists */}
                {personData && (
                  <Link href={`/people/${personData.id}`}>
                    <div className='text-sm text-foreground font-medium truncate hover:underline cursor-pointer'>
                      {personData.name}
                    </div>
                  </Link>
                )}

                {/* Organization information - shown if organization exists */}
                {serverSession.organizationId && (
                  <div className='mt-xs'>
                    <OrganizationPlanInfo
                      organizationName={serverSession.organizationName}
                      organizationId={serverSession.organizationId}
                      variant='vertical'
                    />
                  </div>
                )}

                {/* Create Organization link - shown if no organization */}
                {!serverSession.organizationId && (
                  <Link
                    href='/organization/create'
                    onClick={() => setIsMobileMenuOpen(false)}
                    className='text-xs text-muted-foreground hover:text-foreground underline block mt-xs'
                  >
                    Create Organization
                  </Link>
                )}

                {/* Settings and Sign out links - always shown */}
                <div className='flex items-center gap-md mt-sm'>
                  <Link
                    href='/settings'
                    onClick={() => setIsMobileMenuOpen(false)}
                    className='flex items-center gap-sm text-xs text-muted-foreground hover:text-foreground underline'
                  >
                    <Settings className='h-3 w-3' />
                    <span>Settings</span>
                  </Link>
                  <span className='text-xs text-muted-foreground'>|</span>
                  <button
                    onClick={async () => {
                      setIsMobileMenuOpen(false)
                      await signOutWithCleanup()
                      await signOut({ redirectUrl: '/auth/signin' })
                    }}
                    className='text-xs text-muted-foreground hover:text-foreground underline cursor-pointer'
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className='flex items-start gap-lg'>
              <Skeleton className='h-8 w-8 rounded-full shrink-0' />
              <div className='flex-1 min-w-0 space-y-md'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-3 w-40' />
                <div className='flex items-center gap-md mt-sm'>
                  <Skeleton className='h-3 w-16' />
                  <Skeleton className='h-3 w-1' />
                  <Skeleton className='h-3 w-20' />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className='flex-1 px-lg py-xl space-y-sm'>
          {serverSession ? (
            <>
              {filteredNavigation.map(item => {
                const isActive = pathname === item.href
                const IconComponent = iconMap[item.icon as keyof typeof iconMap]
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-lg px-lg py-md text-sm rounded-lg transition-colors ${geistMono.className} ${
                      isActive
                        ? 'bg-highlight-bg text-highlight border border-highlight/20'
                        : 'text-muted-foreground hover:bg-accent hover:text-highlight'
                    }`}
                  >
                    {IconComponent && <IconComponent className='h-5 w-5' />}
                    {item.name}
                  </Link>
                )
              })}

              {/* AI Chat Button - only show if user has an organization */}
              {serverSession.organizationId && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    toggleAIChat()
                  }}
                  className={`flex items-center gap-lg px-lg py-md text-sm text-muted-foreground hover:text-highlight hover:bg-accent rounded-lg transition-colors w-full ${geistMono.className}`}
                >
                  <Bot className='h-5 w-5' />
                  <span>AI Chat</span>
                </button>
              )}
            </>
          ) : (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className='flex items-center gap-lg px-lg py-md rounded-lg'
                >
                  <Skeleton className='h-5 w-5 rounded' />
                  <Skeleton className='h-4 w-24' />
                </div>
              ))}
            </>
          )}
        </nav>

        {/* Footer Actions */}
        <div className='px-lg py-xl border-t space-y-sm'>
          {serverSession ? (
            <>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  setIsKeyboardShortcutsOpen(true)
                }}
                className={`flex items-center gap-lg px-lg py-md text-sm text-muted-foreground hover:text-highlight hover:bg-accent rounded-lg transition-colors w-full ${geistMono.className}`}
              >
                <Keyboard className='h-5 w-5' />
                <span>Keyboard Shortcuts</span>
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  setIsGettingStartedOpen(true)
                }}
                className={`flex items-center gap-lg px-lg py-md text-sm text-muted-foreground hover:text-highlight hover:bg-accent rounded-lg transition-colors w-full ${geistMono.className}`}
              >
                <BookOpen className='h-5 w-5' />
                <span>Help</span>
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  setIsBugOpen(true)
                }}
                className={`flex items-center gap-lg px-lg py-md text-sm text-muted-foreground hover:text-highlight hover:bg-accent rounded-lg transition-colors w-full ${geistMono.className}`}
              >
                <Bug className='h-5 w-5' />
                <span>Report a bug</span>
              </button>
            </>
          ) : (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className='flex items-center gap-lg px-lg py-md rounded-lg'
                >
                  <Skeleton className='h-5 w-5 rounded' />
                  <Skeleton className='h-4 w-32' />
                </div>
              ))}
            </>
          )}
        </div>

        {/* Version Footer */}
        <div className='px-lg py-md border-t'>
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
