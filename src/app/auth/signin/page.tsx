'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import { AnimatedGeometricPattern } from '@/components/marketing/animated-geometric-pattern'
import { AuthMarketingPanel } from '@/components/auth/auth-marketing-panel'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()

  // Check for error in URL parameters
  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) {
      switch (urlError) {
        case 'CredentialsSignin':
          setError(
            'Invalid email or password. Please check your credentials and try again.'
          )
          break
        case 'Configuration':
          setError('There is a problem with the server configuration.')
          break
        case 'AccessDenied':
          setError('Access denied. You do not have permission to sign in.')
          break
        case 'Verification':
          setError(
            'The verification token has expired or has already been used.'
          )
          break
        default:
          setError('An error occurred during sign in. Please try again.')
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false, // Don't redirect immediately so we can handle errors
        callbackUrl: '/',
      })

      if (result?.error) {
        switch (result.error) {
          case 'CredentialsSignin':
            setError(
              'Invalid email or password. Please check your credentials and try again.'
            )
            break
          case 'Configuration':
            setError('There is a problem with the server configuration.')
            break
          case 'AccessDenied':
            setError('Access denied. You do not have permission to sign in.')
            break
          case 'Verification':
            setError(
              'The verification token has expired or has already been used.'
            )
            break
          default:
            setError('An error occurred during sign in. Please try again.')
        }
      } else if (result?.ok) {
        // Success - redirect manually
        router.push(result.url || '/')
      }
    } catch (error) {
      console.error('Error signing in:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
      <div className='relative z-10 flex min-h-screen flex-col lg:flex-row'>
        {/* Left side - Marketing content */}
        <div className='hidden lg:flex lg:w-1/2 lg:flex-col'>
          <AuthMarketingPanel />
        </div>

        {/* Right side - Sign in form */}
        <div className='flex w-full items-start justify-center p-4 lg:w-1/2'>
          <div className='w-full space-y-6'>
            <div className='space-y-2 text-center'>
              <h1 className='text-2xl font-bold text-white'>Welcome back</h1>
              <p className='text-sm text-white/70'>
                Sign in to your account to continue
              </p>
            </div>
            <form onSubmit={handleSubmit} className='space-y-4'>
              {error && (
                <div className='flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm'>
                  <AlertCircle className='h-4 w-4 shrink-0' />
                  <span>{error}</span>
                </div>
              )}
              <div className='space-y-2'>
                <Label htmlFor='email' className='text-white'>
                  Email address
                </Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  required
                  placeholder='john@example.com'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className=''
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='password' className='text-white'>
                  Password
                </Label>
                <Input
                  id='password'
                  name='password'
                  type='password'
                  autoComplete='current-password'
                  required
                  placeholder='Enter your password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className=''
                />
              </div>
              <Button type='submit' disabled={isLoading} className='w-full'>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
            <div className='flex flex-col space-y-2'>
              <div className='text-sm text-white/70 text-center'>
                <Link
                  href='/auth/forgot-password'
                  className='underline underline-offset-4'
                >
                  Forgot your password?
                </Link>
              </div>
              <div className='text-sm text-white/70 text-center'>
                Don&apos;t have an account?{' '}
                <Link
                  href='/auth/signup'
                  className='underline underline-offset-4'
                >
                  Create account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
