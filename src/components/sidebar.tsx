'use client'

import { Link } from '@/components/ui/link'
import { useClerk, useUser } from '@clerk/nextjs'
import { signOutWithCleanup } from '@/lib/auth-client-utils'
import { usePathname } from 'next/navigation'
import { useMobileMenu } from '@/components/mobile-menu-provider'
import { IndigoIcon } from '@/components/indigo-icon'
import type { UserBrief } from '@/lib/auth-types'
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
  Bot,
  CheckSquare,
  Keyboard,
  Bug,
  BookOpen,
  FileText,
  Briefcase,
  Bell,
  MessageSquare,
} from 'lucide-react'
import { useState } from 'react'
import { BugSubmissionModal } from '@/components/bug-submission-modal'
import { HELP_IDS } from '@/lib/help'
import { useAIChat } from '@/components/ai-chat-provider'
import { APP_VERSION } from '@/lib/version'
import { PersonAvatar } from '@/components/people/person-avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { PersonBrief } from '../types/person'
import { SidebarOrganizationSwitcher } from '@/components/organization/sidebar-organization-switcher'
import { HelpLink } from './shared'
import { SidebarLink } from './sidebar/sidebar-link'
import { SidebarButton } from './sidebar/sidebar-button'
interface NavItem {
  name: string
  href: string
  icon: string
  adminOnly?: boolean
  requiresPermission?: string
  badgeCount?: number
  badgeVariant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'neutral'
  section?: string
}

interface SidebarProps {
  navigation?: NavItem[]
  serverSession?: UserBrief | null
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
  CheckSquare,
  FileText,
  Briefcase,
  Bell,
  MessageSquare,
}

export default function Sidebar({
  navigation = [],
  serverSession,
  personData,
}: SidebarProps) {
  const { user } = useUser()
  const pathname = usePathname()
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu()
  const [isBugOpen, setIsBugOpen] = useState(false)
  const { toggleAIChat } = useAIChat()
  const { signOut } = useClerk()

  // Use the navigation passed from server-side filtering
  const filteredNavigation = navigation

  // Separate Dashboard from grouped items
  const dashboardItem = filteredNavigation.find(
    item => item.href === '/dashboard'
  )
  const itemsWithoutDashboard = filteredNavigation.filter(
    item => item.href !== '/dashboard'
  )

  // Group navigation items by section
  const groupedNavigation = itemsWithoutDashboard.reduce(
    (acc, item) => {
      const section = item.section || 'Other'
      if (!acc[section]) {
        acc[section] = []
      }
      acc[section].push(item)
      return acc
    },
    {} as Record<string, typeof itemsWithoutDashboard>
  )

  // Define section order
  const sectionOrder = ['Teams and People', 'Planning', 'Organization', 'Other']

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
        <div className='flex h-14 items-center px-xl border-b'>
          <div className='flex items-center gap-md'>
            <IndigoIcon width={32} height={26} color='currentColor' />
            <h1
              className={`text-base font-semibold text-foreground ${geistMono.className}`}
            >
              [<span className='text-highlight'>mpath</span>]
            </h1>
          </div>
        </div>

        {/* User Info */}
        <div className='px-xl py-md border-b'>
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
              <div
                className={`flex-1 flex flex-col gap-sm min-w-0 ${geistMono.className}`}
              >
                {/* Email - only shown if no person is associated */}
                {!personData && (
                  <div className='text-xs text-foreground font-medium truncate'>
                    {serverSession.email
                      ? serverSession.email
                      : user?.emailAddresses[0].emailAddress}
                  </div>
                )}

                {/* Person name - shown if person exists */}
                {personData && (
                  <Link href={`/people/${personData.id}`}>
                    <div className='text-xs text-foreground font-medium truncate hover:underline cursor-pointer'>
                      {personData.name}
                    </div>
                  </Link>
                )}

                {/* Organization information - shown if organization exists */}
                <div className='my-sm text-muted-foreground'>
                  <SidebarOrganizationSwitcher />
                </div>

                {/* Settings and Sign out links - always shown */}
                <div className='flex items-center gap-md mt-xs'>
                  <Link
                    href='/settings'
                    onClick={() => setIsMobileMenuOpen(false)}
                    className='flex items-center gap-xs text-xs text-muted-foreground hover:text-foreground underline'
                  >
                    <Settings className='h-3 w-3' />
                    <span>Settings</span>
                  </Link>
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
        <nav className='flex-1 px-md py-md space-y-lg'>
          {serverSession ? (
            <>
              {/* Dashboard - standalone above sections */}
              {dashboardItem && (
                <div className='mb-lg'>
                  <SidebarLink
                    href={dashboardItem.href}
                    name={dashboardItem.name}
                    icon={
                      iconMap[dashboardItem.icon as keyof typeof iconMap] ||
                      undefined
                    }
                    isActive={pathname === dashboardItem.href}
                    badgeCount={dashboardItem.badgeCount}
                    badgeVariant={dashboardItem.badgeVariant}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
              )}

              {sectionOrder.map(section => {
                const items = groupedNavigation[section] || []
                if (items.length === 0 && section !== 'Support') return null

                return (
                  <div key={section} className='space-y-sm'>
                    <div className='px-md py-xs'>
                      <h3 className='text-xs font-medium text-highlight uppercase tracking-wider'>
                        {section}
                      </h3>
                    </div>
                    <div className='space-y-md'>
                      {items.map(item => (
                        <SidebarLink
                          key={item.name}
                          href={item.href}
                          name={item.name}
                          icon={
                            iconMap[item.icon as keyof typeof iconMap] ||
                            undefined
                          }
                          isActive={pathname === item.href}
                          badgeCount={item.badgeCount}
                          badgeVariant={item.badgeVariant}
                          onClick={() => setIsMobileMenuOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Support Section - AI Chat and Footer Items */}
              <div className='space-y-sm'>
                <div className='px-md py-xs'>
                  <h3 className='text-xs font-medium text-highlight uppercase tracking-wider'>
                    Support
                  </h3>
                </div>
                <div className='space-y-md'>
                  {/* AI Chat Button - only show if user has an organization */}
                  {Boolean(user?.publicMetadata?.managerOSOrganizationId) && (
                    <SidebarButton
                      name='AI Chat'
                      icon={Bot}
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        toggleAIChat()
                      }}
                    />
                  )}
                  <HelpLink
                    helpId={HELP_IDS.keyboardShortcuts}
                    className={`flex items-center justify-start gap-lg px-lg py-sm text-xs text-muted-foreground hover:text-highlight hover:bg-accent rounded-lg transition-colors w-full ${geistMono.className}`}
                  >
                    <Keyboard className='h-4 w-4' />
                    <span className='text-left'>Keyboard Shortcuts</span>
                  </HelpLink>
                  <HelpLink
                    helpId={HELP_IDS.concepts}
                    className={`flex items-center justify-start gap-lg px-lg py-sm text-xs text-muted-foreground hover:text-highlight hover:bg-accent rounded-lg transition-colors w-full ${geistMono.className}`}
                  >
                    <BookOpen className='h-4 w-4' />
                    <span className='text-left'>Core Concepts</span>
                  </HelpLink>
                  <SidebarButton
                    name='Report a bug'
                    icon={Bug}
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      setIsBugOpen(true)
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className='flex items-center gap-md px-md py-xs rounded-lg'
                >
                  <Skeleton className='h-4 w-4 rounded' />
                  <Skeleton className='h-3 w-24' />
                </div>
              ))}
            </>
          )}
        </nav>

        {/* Version Footer */}
        <div className='px-md py-sm border-t'>
          <div className='text-xs text-muted-foreground text-center'>
            v{APP_VERSION}
          </div>
        </div>
      </div>

      <BugSubmissionModal open={isBugOpen} onOpenChange={setIsBugOpen} />
    </>
  )
}
