import type { ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { AnimatedGeometricPattern } from '@/components/marketing/animated-geometric-pattern'
import Image from 'next/image'
import Link from 'next/link'

export default function FeedbackFormLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='dark'
      enableSystem={true}
      storageKey='manageros-theme'
      disableTransitionOnChange
    >
      <main className='relative min-h-screen overflow-hidden bg-[#05070f] text-white'>
        {/* Animated background */}
        <div className='pointer-events-none absolute inset-0 overflow-hidden'>
          <AnimatedGeometricPattern />
          {/* Additional gradient overlay */}
          <div
            className='absolute inset-0'
            style={{
              background: `radial-gradient(circle at center, var(--color-primary) 0%, transparent 70%)`,
              opacity: 0.1,
            }}
          />
          <div className='absolute inset-0 bg-[#05070f]/50' />
        </div>

        {/* Content */}
        <div className='relative z-10 flex min-h-screen flex-col'>
          {/* Logo header - centered at top */}
          <header className='flex w-full items-center justify-center px-6 py-8'>
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
                <p className='text-lg font-semibold tracking-tight'>
                  ManagerOS
                </p>
                <p className='text-xs text-white/60 hidden sm:block'>
                  Built for engineering leaders
                </p>
              </div>
            </Link>
          </header>

          {/* Main content */}
          <div className='flex-1'>{children}</div>
        </div>
        <Toaster theme='system' />
      </main>
    </ThemeProvider>
  )
}
