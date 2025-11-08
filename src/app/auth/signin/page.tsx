'use client'

import { SignIn } from '@clerk/nextjs'
import { AnimatedGeometricPattern } from '@/components/marketing/animated-geometric-pattern'
import { AuthMarketingPanel } from '@/components/auth/auth-marketing-panel'

export default function SignInPage() {
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
      <div className='relative z-10 flex min-h-screen flex-col lg:flex-row'>
        {/* Left side - Marketing content */}
        <div className='hidden lg:flex lg:w-1/2 lg:flex-col'>
          <AuthMarketingPanel />
        </div>

        {/* Right side - Sign in form */}
        <div className='flex w-full items-start justify-center p-4 mt-10 lg:w-1/2'>
          <div className='w-full'>
            <SignIn
              routing='path'
              path='/auth/signin'
              signUpUrl='/auth/signup'
            />
          </div>
        </div>
      </div>
    </div>
  )
}
