'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Home,
  Lightbulb,
  Users,
  Users2,
  ClipboardList,
  MessageSquare,
  MessageCircle,
  Mail,
  Settings,
  Menu,
  X,
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Initiatives', href: '/initiatives', icon: Lightbulb },
  { name: 'People', href: '/people', icon: Users },
  { name: 'Teams', href: '/teams', icon: Users2 },
  { name: 'Tasks', href: '/tasks', icon: ClipboardList },
  { name: '1:1s', href: '/oneonones', icon: MessageSquare },
  { name: 'Feedback', href: '/feedback', icon: MessageCircle },
  {
    name: 'Invitations',
    href: '/organization/invitations',
    icon: Mail,
    adminOnly: true,
  },
  { name: 'Your Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  if (status === 'loading') {
    return (
      <div className='hidden lg:flex h-screen w-64 flex-col bg-neutral-900 border-r border-neutral-800'>
        <div className='flex h-16 items-center px-6'>
          <h1 className='text-xl font-semibold text-neutral-100'>ManagerOS</h1>
        </div>
        <div className='flex-1 px-6 py-4'>
          <div className='text-sm text-neutral-400'>Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className='hidden lg:flex h-screen w-64 flex-col bg-neutral-900 border-r border-neutral-800'>
        <div className='flex h-16 items-center px-6'>
          <h1 className='text-xl font-semibold text-neutral-100'>ManagerOS</h1>
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
      </div>
    )
  }

  const filteredNavigation = navigation.filter(
    item => !item.adminOnly || session.user.role === 'ADMIN'
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className='lg:hidden fixed top-4 left-4 z-50 p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 hover:bg-neutral-700 transition-colors'
      >
        {isMobileMenuOpen ? (
          <X className='h-5 w-5' />
        ) : (
          <Menu className='h-5 w-5' />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className='lg:hidden fixed inset-0 bg-black/50 z-40'
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-neutral-900 border-r border-neutral-800 transform transition-transform duration-300 ease-in-out sidebar-scroll overflow-y-auto ${
          isMobileMenuOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className='flex h-16 items-center px-6 border-b border-neutral-800'>
          <h1 className='text-xl font-semibold text-neutral-100'>ManagerOS</h1>
        </div>

        {/* User Info */}
        <div className='px-6 py-4 border-b border-neutral-800'>
          <div className='text-sm text-neutral-100 font-medium'>
            {session.user.name}
          </div>
          <div className='text-xs text-neutral-400'>
            {session.user.organizationName}
          </div>
          <div className='text-xs text-neutral-500'>{session.user.role}</div>
        </div>

        {/* Navigation */}
        <nav className='flex-1 px-3 py-4 space-y-1'>
          {filteredNavigation.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
                    : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50'
                }`}
              >
                <item.icon className='h-5 w-5' />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Settings and Sign Out */}
        <div className='px-3 py-4 border-t border-neutral-800 space-y-1'>
          <Link
            href='/organization/settings'
            onClick={() => setIsMobileMenuOpen(false)}
            className='flex items-center gap-3 px-3 py-2 text-sm text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50 rounded-lg transition-colors'
          >
            <Settings className='h-5 w-5' />
            Org Settings
          </Link>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false)
              signOut()
            }}
            className='flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors w-full'
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
      </div>
    </>
  )
}
