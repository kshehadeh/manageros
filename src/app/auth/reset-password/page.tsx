'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  // Validate token on component mount
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token')
      setTokenValid(false)
      return
    }

    const validateToken = async () => {
      try {
        const response = await fetch(
          `/api/auth/validate-reset-token?token=${token}`
        )
        if (!response.ok) {
          setError('Invalid or expired reset token')
          setTokenValid(false)
        } else {
          setTokenValid(true)
        }
      } catch (error) {
        console.error('Error validating reset token:', error)
        setError('Failed to validate reset token')
        setTokenValid(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reset password')
      }

      setSuccess('Password reset successfully! Redirecting to sign in...')

      // Redirect to sign in after a short delay
      setTimeout(() => {
        router.push('/auth/signin')
      }, 2000)
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

  if (tokenValid === null) {
    return (
      <div className='p-4'>
        <Card className='w-full max-w-xl'>
          <CardContent className='pt-6'>
            <div className='text-center'>Validating reset token...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className='p-4'>
        <Card className='w-full max-w-xl'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl font-bold text-center text-destructive'>
              Invalid Reset Link
            </CardTitle>
            <CardDescription className='text-center'>
              This password reset link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm'>
              <AlertCircle className='h-4 w-4 flex-shrink-0' />
              <span>{error}</span>
            </div>
          </CardContent>
          <CardFooter className='flex flex-col space-y-2'>
            <div className='text-sm text-muted-foreground text-center'>
              <Link
                href='/auth/forgot-password'
                className='underline underline-offset-4'
              >
                Request a new reset link
              </Link>
            </div>
            <div className='text-sm text-muted-foreground text-center'>
              <Link
                href='/auth/signin'
                className='inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground'
              >
                <ArrowLeft className='h-3 w-3' />
                Back to sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className='p-4'>
      <Card className='w-full max-w-xl'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>
            Set new password
          </CardTitle>
          <CardDescription className='text-center'>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {error && (
              <div className='flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm'>
                <AlertCircle className='h-4 w-4 flex-shrink-0' />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className='flex items-center gap-2 rounded-lg bg-secondary/30 border text-foreground px-4 py-3 text-sm'>
                <CheckCircle2 className='h-4 w-4 flex-shrink-0' />
                <span>{success}</span>
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='password'>New Password</Label>
              <Input
                id='password'
                name='password'
                type='password'
                autoComplete='new-password'
                required
                placeholder='Enter your new password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                className=''
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm New Password</Label>
              <Input
                id='confirmPassword'
                name='confirmPassword'
                type='password'
                autoComplete='new-password'
                required
                placeholder='Confirm your new password'
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className=''
              />
            </div>

            <Button type='submit' disabled={isLoading} className='w-full'>
              {isLoading ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className='flex flex-col space-y-2'>
          <div className='text-sm text-muted-foreground text-center'>
            <Link
              href='/auth/signin'
              className='inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground'
            >
              <ArrowLeft className='h-3 w-3' />
              Back to sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
