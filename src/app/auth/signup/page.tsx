'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationSlug: '',
    createOrganization: false,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

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
          organizationName: formData.createOrganization
            ? formData.organizationName
            : undefined,
          organizationSlug: formData.createOrganization
            ? formData.organizationSlug
            : undefined,
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
        redirect: false,
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
        } else {
          router.push('/')
        }
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
    <div className='p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>
            Create an account
          </CardTitle>
          <CardDescription className='text-center'>
            Enter your information to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {error && (
              <div className='flex items-center gap-2 rounded-lg bg-destructive/20 border border-destructive text-destructive px-4 py-3 text-sm'>
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
              <Label htmlFor='name'>Full Name</Label>
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
              <Label htmlFor='email'>Email Address</Label>
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

            <div className='border-t pt-4'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='createOrganization'
                  checked={formData.createOrganization}
                  onCheckedChange={checked =>
                    setFormData(prev => ({
                      ...prev,
                      createOrganization: checked as boolean,
                    }))
                  }
                />
                <Label
                  htmlFor='createOrganization'
                  className='text-sm font-normal cursor-pointer'
                >
                  Create a new organization
                </Label>
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>
                If unchecked, you&apos;ll need to be invited to an existing
                organization to access the platform.
              </p>
            </div>

            {formData.createOrganization && (
              <>
                <div className='space-y-2'>
                  <Label htmlFor='organizationName' className=''>
                    Organization Name
                  </Label>
                  <Input
                    id='organizationName'
                    name='organizationName'
                    type='text'
                    required={formData.createOrganization}
                    placeholder='Acme Corp'
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    className=''
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='organizationSlug' className=''>
                    Organization Slug
                  </Label>
                  <Input
                    id='organizationSlug'
                    name='organizationSlug'
                    type='text'
                    required={formData.createOrganization}
                    placeholder='acme-corp'
                    value={formData.organizationSlug}
                    onChange={handleInputChange}
                    className=''
                  />
                  <p className='text-xs text-muted-foreground'>
                    Used in URLs. Only lowercase letters, numbers, and hyphens
                    allowed.
                  </p>
                </div>
              </>
            )}

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
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
              <Label htmlFor='confirmPassword'>Confirm Password</Label>
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
        </CardContent>
        <CardFooter className='flex flex-col space-y-2'>
          <div className='text-sm text-muted-foreground text-center'>
            Already have an account?{' '}
            <Link href='/auth/signin' className='underline underline-offset-4'>
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
