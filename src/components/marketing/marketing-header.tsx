'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Link } from '@/components/ui/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Geist_Mono as GeistMono } from 'next/font/google'

const geistMono = GeistMono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export function MarketingHeader() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className='mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-6 py-8 sm:px-8 md:flex-row md:items-center md:justify-between md:gap-0'>
      <div className='flex w-full items-center justify-between md:w-auto'>
        <Link href='/' className='flex items-center gap-3'>
          <Image
            src='/images/indigo-logo-white.png'
            alt='mpath Logo'
            width={40}
            height={40}
            className='h-10 w-10'
            priority
          />
          <div>
            <p
              className={`text-lg font-semibold tracking-tight ${geistMono.className}`}
            >
              mpath
            </p>
            <p
              className={`text-xs text-white/60 hidden md:block ${geistMono.className}`}
            >
              Built for engineering leaders
            </p>
          </div>
        </Link>
        {/* Mobile hamburger button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className='md:hidden p-2 text-white/70 hover:text-white transition-colors'
          aria-label='Toggle menu'
        >
          {isMobileMenuOpen ? (
            <X className='h-6 w-6' />
          ) : (
            <Menu className='h-6 w-6' />
          )}
        </button>
      </div>
      <nav
        className={`hidden items-center gap-8 text-sm font-medium text-white/70 md:flex ${geistMono.className}`}
      >
        {!isHomePage && (
          <Link href='/' className='transition-colors hover:text-white'>
            Home
          </Link>
        )}
        {isHomePage && (
          <Link href='#features' className='transition-colors hover:text-white'>
            Features
          </Link>
        )}
        {isHomePage && (
          <Link href='#proof' className='transition-colors hover:text-white'>
            Outcomes
          </Link>
        )}
        {isHomePage && (
          <Link href='#cta' className='transition-colors hover:text-white'>
            Get Started
          </Link>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={`flex items-center gap-1 transition-colors hover:text-white outline-none ${geistMono.className}`}
          >
            Product Tour
            <ChevronDown className='h-4 w-4' />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            className={`bg-white/95 backdrop-blur-sm border-white/20 ${geistMono.className}`}
          >
            <DropdownMenuItem asChild>
              <Link
                href='/landing/initiatives'
                className='text-black cursor-pointer'
              >
                Initiatives
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href='/landing/people'
                className='text-black cursor-pointer'
              >
                People
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href='/landing/meetings'
                className='text-black cursor-pointer'
              >
                Meetings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href='/landing/tasks' className='text-black cursor-pointer'>
                Tasks
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div
          className={`md:hidden w-full flex flex-col gap-4 pb-4 border-t border-white/20 pt-4 animate-in slide-in-from-top-2 ${geistMono.className}`}
        >
          <nav className='flex flex-col gap-4'>
            {!isHomePage && (
              <Link
                href='/'
                onClick={() => setIsMobileMenuOpen(false)}
                className='text-sm font-medium text-white/70 transition-colors hover:text-white'
              >
                Home
              </Link>
            )}
            {isHomePage && (
              <Link
                href='#features'
                onClick={() => setIsMobileMenuOpen(false)}
                className='text-sm font-medium text-white/70 transition-colors hover:text-white'
              >
                Features
              </Link>
            )}
            {isHomePage && (
              <Link
                href='#proof'
                onClick={() => setIsMobileMenuOpen(false)}
                className='text-sm font-medium text-white/70 transition-colors hover:text-white'
              >
                Outcomes
              </Link>
            )}
            {isHomePage && (
              <Link
                href='#cta'
                onClick={() => setIsMobileMenuOpen(false)}
                className='text-sm font-medium text-white/70 transition-colors hover:text-white'
              >
                Get Started
              </Link>
            )}
            <div className='flex flex-col gap-2'>
              <p className='text-sm font-medium text-white/70'>Product Tour</p>
              <Link
                href='/landing/initiatives'
                onClick={() => setIsMobileMenuOpen(false)}
                className='text-sm text-white/60 transition-colors hover:text-white pl-4'
              >
                Initiatives
              </Link>
              <Link
                href='/landing/people'
                onClick={() => setIsMobileMenuOpen(false)}
                className='text-sm text-white/60 transition-colors hover:text-white pl-4'
              >
                People
              </Link>
              <Link
                href='/landing/meetings'
                onClick={() => setIsMobileMenuOpen(false)}
                className='text-sm text-white/60 transition-colors hover:text-white pl-4'
              >
                Meetings
              </Link>
              <Link
                href='/landing/tasks'
                onClick={() => setIsMobileMenuOpen(false)}
                className='text-sm text-white/60 transition-colors hover:text-white pl-4'
              >
                Tasks
              </Link>
            </div>
          </nav>
          {/* Mobile auth buttons */}
          <div className='flex flex-col gap-2 pt-2 border-t border-white/20'>
            <Button
              asChild
              variant='ghost'
              className='text-white/80 hover:text-white w-full'
            >
              <Link
                href='/auth/signin'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign in
              </Link>
            </Button>
            <Button
              asChild
              className='bg-white text-black shadow-[0_18px_40px_rgba(88,86,255,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 w-full'
            >
              <Link
                href='/auth/signup'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Register now
              </Link>
            </Button>
          </div>
        </div>
      )}
      <div
        className={`hidden md:flex items-center gap-3 ${geistMono.className}`}
      >
        <Button
          asChild
          variant='ghost'
          className='text-white/80 hover:text-white'
        >
          <Link href='/auth/signin'>Sign in</Link>
        </Button>
        <Button
          asChild
          className='bg-white text-black shadow-[0_18px_40px_rgba(88,86,255,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90'
        >
          <Link href='/auth/signup'>Register now</Link>
        </Button>
      </div>
    </header>
  )
}
