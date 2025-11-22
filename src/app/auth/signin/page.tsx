'use client'

import { SignIn, useAuth } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { AnimatedGeometricPattern } from '@/components/marketing/animated-geometric-pattern'
import { AuthMarketingPanel } from '@/components/auth/auth-marketing-panel'

export default function SignInPage() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Redirect authenticated users to dashboard or redirect_url
    if (isLoaded && userId) {
      const redirectUrl = searchParams.get('redirect_url') || '/dashboard'
      router.replace(redirectUrl)
    }
  }, [isLoaded, userId, router, searchParams])

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className='relative min-h-screen overflow-hidden bg-[#05070f] flex items-center justify-center'>
        <div className='text-foreground'>Loading...</div>
      </div>
    )
  }

  // Don't render sign-in if user is authenticated (redirect will happen)
  if (userId) {
    return null
  }

  return (
    <div className='relative min-h-screen overflow-hidden bg-[#05070f]'>
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
      <div className='relative z-10 flex min-h-screen flex-col items-start sm:justify-center sm:flex-row'>
        {/* Left side - Marketing content */}
        <div className='hidden lg:flex lg:w-1/2 lg:flex-col'>
          <AuthMarketingPanel />
        </div>

        {/* Right side - Sign in form */}
        <div className='flex w-full items-start sm:justify-center p-4 lg:w-1/2'>
          <SignIn
            routing='hash'
            signUpUrl='/auth/signup'
            fallbackRedirectUrl='/dashboard'
          />
        </div>
      </div>
    </div>
  )
}
