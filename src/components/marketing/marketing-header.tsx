'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function MarketingHeader() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  return (
    <header className='mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 sm:px-8'>
      <Link href='/' className='flex items-center gap-3'>
        <Image
          src='/images/indigo-logo-white.png'
          alt='ManagerOS Logo'
          width={40}
          height={40}
          className='h-10 w-10'
          priority
        />
        <div>
          <p className='text-lg font-semibold tracking-tight'>ManagerOS</p>
          <p className='text-xs text-white/60'>Built for engineering leaders</p>
        </div>
      </Link>
      <nav className='hidden items-center gap-8 text-sm font-medium text-white/70 md:flex'>
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
          <DropdownMenuTrigger className='flex items-center gap-1 transition-colors hover:text-white outline-none'>
            Product Tour
            <ChevronDown className='h-4 w-4' />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            className='bg-white/95 backdrop-blur-sm border-white/20'
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
      <div className='flex items-center gap-3'>
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
