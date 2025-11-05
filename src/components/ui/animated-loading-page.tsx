'use client'

import Image from 'next/image'
import { Loading } from '@/components/ui/loading'
import { AnimatedGeometricPattern } from '@/components/marketing/animated-geometric-pattern'
import { useTheme } from '@/lib/hooks/use-theme'
import { useEffect, useState } from 'react'

interface AnimatedLoadingPageProps {
  text?: string
}

export function AnimatedLoadingPage({
  text = 'Loading...',
}: AnimatedLoadingPageProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use black logo for light theme, white logo for dark theme
  const logoSrc =
    mounted && theme === 'light'
      ? '/images/indigo-logo-black.png'
      : '/images/indigo-logo-white.png'

  return (
    <div className='relative min-h-screen overflow-hidden bg-background text-foreground flex items-center justify-center'>
      {/* Background animations */}
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
        <div className='absolute inset-0 bg-background/50' />
      </div>

      {/* Content */}
      <div className='relative z-10 flex flex-col items-center space-y-8'>
        {/* Animated logo */}
        <div className='relative'>
          {/* Glow effect behind logo */}
          <div className='absolute -inset-12 rounded-full bg-gradient-to-r from-primary/30 via-primary/40 to-primary/30 blur-3xl animate-pulse' />

          {/* Logo with animation */}
          <div className='relative animate-[fadeInScale_1s_ease-out]'>
            <Image
              src={logoSrc}
              alt='ManagerOS Logo'
              width={120}
              height={120}
              className='h-[120px] w-[120px]'
              style={{
                filter: 'drop-shadow(0 0 30px var(--color-primary))',
                opacity: 0.8,
              }}
              priority
            />
          </div>
        </div>

        {/* Loading spinner */}
        <div className='flex flex-col items-center space-y-4'>
          <Loading size='lg' />
          <p className='text-base text-muted-foreground animate-pulse'>
            {text}
          </p>
        </div>
      </div>
    </div>
  )
}
