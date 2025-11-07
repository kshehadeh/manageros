'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { AnimatedGeometricPattern } from '@/components/marketing/animated-geometric-pattern'
import { AuthMarketingPanel } from '@/components/auth/auth-marketing-panel'

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create account')
      }

      const responseData = await response.json()

      // Auto sign in after successful registration
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: true,
        callbackUrl: '/',
      })

      if (result?.error) {
        setError(
          'Account created but failed to sign in. Please try signing in manually.'
        )
      } else {
        // Show success message if user was invited
        if (responseData.wasInvited) {
          setSuccess(responseData.message)
          // Redirect after a short delay to show the success message
          setTimeout(() => {
            router.push('/')
          }, 2000)
        }
        // If not invited, NextAuth will handle the redirect automatically
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'An error occurred. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
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

        {/* Right side - Sign up form */}
        <div className='flex w-full items-start justify-center p-4 lg:w-1/2 lg:p-8'>
          <div className='w-full space-y-6'>
            <div className='space-y-2 text-center'>
              <h1 className='text-2xl font-bold text-white'>
                Create an account
              </h1>
              <p className='text-sm text-white/70'>
                Enter your information to get started
              </p>
            </div>
            <form onSubmit={handleSubmit} className='space-y-4'>
              {error && (
                <div className='flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm'>
                  <AlertCircle className='h-4 w-4 shrink-0' />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className='flex items-center gap-2 rounded-lg bg-secondary/30 border text-foreground px-4 py-3 text-sm'>
                  <CheckCircle2 className='h-4 w-4 shrink-0' />
                  <span>{success}</span>
                </div>
              )}

              <div className='space-y-2'>
                <Label htmlFor='name' className='text-white'>
                  Full Name
                </Label>
                <Input
                  id='name'
                  name='name'
                  type='text'
                  required
                  placeholder='John Doe'
                  value={formData.name}
                  onChange={handleInputChange}
                  className=''
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email' className='text-white'>
                  Email Address
                </Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  required
                  placeholder='john@example.com'
                  value={formData.email}
                  onChange={handleInputChange}
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
                  autoComplete='new-password'
                  required
                  placeholder='Create a strong password'
                  value={formData.password}
                  onChange={handleInputChange}
                  className=''
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword' className='text-white'>
                  Confirm Password
                </Label>
                <Input
                  id='confirmPassword'
                  name='confirmPassword'
                  type='password'
                  autoComplete='new-password'
                  required
                  placeholder='Confirm your password'
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className=''
                />
              </div>

              <Button type='submit' disabled={isLoading} className='w-full'>
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
            <div className='flex flex-col space-y-2'>
              <div className='text-sm text-white/70 text-center'>
                Already have an account?{' '}
                <Link
                  href='/auth/signin'
                  className='underline underline-offset-4'
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
