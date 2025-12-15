'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Link } from '@/components/ui/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
              Built for team leaders
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
        <Link href='/pricing' className='transition-colors hover:text-white'>
          Pricing
        </Link>
        <Link
          href='https://help.mpath.dev'
          target='_blank'
          className='transition-colors hover:text-white'
        >
          Help
        </Link>
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
            <Link
              href='/pricing'
              onClick={() => setIsMobileMenuOpen(false)}
              className='text-sm font-medium text-white/70 transition-colors hover:text-white'
            >
              Pricing
            </Link>
            <Link
              href='https://help.mpath.dev'
              target='_blank'
              onClick={() => setIsMobileMenuOpen(false)}
              className='text-sm font-medium text-white/70 transition-colors hover:text-white'
            >
              Help
            </Link>
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
              className='bg-primary text-primary-foreground shadow-[0_18px_40px_color-mix(in_srgb,var(--color-primary)_45%,transparent)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 w-full'
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
          className='bg-primary text-primary-foreground shadow-[0_18px_40px_color-mix(in_srgb,var(--color-primary)_45%,transparent)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90'
        >
          <Link href='/auth/signup'>Register now</Link>
        </Button>
      </div>
    </header>
  )
}
