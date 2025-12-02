import type { ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { AnimatedGeometricPattern } from '@/components/marketing/animated-geometric-pattern'

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
          {/* Main content */}
          <div className='flex-1'>{children}</div>
        </div>
        <Toaster theme='system' />
      </main>
    </ThemeProvider>
  )
}
