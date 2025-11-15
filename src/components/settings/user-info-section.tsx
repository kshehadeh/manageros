'use client'

import { dark } from '@clerk/themes'
import { SignedIn, useUser } from '@clerk/nextjs'
import { SubscriptionDetailsButton } from '@clerk/nextjs/experimental'
import { Button } from '../ui/button'
import {
  FaGoogle,
  FaGithub,
  FaMicrosoft,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaDiscord,
} from 'react-icons/fa'
import { SiApple } from 'react-icons/si'
import type { ComponentType } from 'react'

interface ProviderInfo {
  icon: ComponentType<{ className?: string }>
  name: string
}

const PROVIDER_MAP: Record<string, ProviderInfo> = {
  google: { icon: FaGoogle, name: 'Google' },
  github: { icon: FaGithub, name: 'GitHub' },
  microsoft: { icon: FaMicrosoft, name: 'Microsoft' },
  facebook: { icon: FaFacebook, name: 'Facebook' },
  twitter: { icon: FaTwitter, name: 'Twitter' },
  linkedin: { icon: FaLinkedin, name: 'LinkedIn' },
  discord: { icon: FaDiscord, name: 'Discord' },
  apple: { icon: SiApple, name: 'Apple' },
}

function getProviderInfo(provider: string): ProviderInfo {
  const normalizedProvider = provider.toLowerCase()
  return (
    PROVIDER_MAP[normalizedProvider] || {
      icon: () => null,
      name: provider.charAt(0).toUpperCase() + provider.slice(1),
    }
  )
}

interface UserInfoSectionProps {
  email: string
  userId?: string
  role?: string
}

function getRoleLabel(role: string): string {
  if (role === 'OWNER') return 'Owner'
  if (role === 'ADMIN') return 'Admin'
  return 'User'
}

export function UserInfoSection({ userId, role }: UserInfoSectionProps) {
  const { user } = useUser()
  return (
    <div className='space-y-2'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
        <div>
          <p className='text-sm font-medium'>Email</p>
          <div className='text-sm text-muted-foreground'>
            <div className='flex flex-row gap-sm items-center'>
              <span>{user?.emailAddresses[0].emailAddress}</span>
              <span>
                {user?.externalAccounts?.map(account => {
                  const providerInfo = getProviderInfo(account.provider)
                  const Icon = providerInfo.icon
                  return <Icon className='h-4 w-4' />
                })}
              </span>
            </div>
          </div>
        </div>
        {role && (
          <div>
            <p className='text-sm font-medium'>Role</p>
            <p className='text-sm text-muted-foreground'>
              {getRoleLabel(role)}
            </p>
          </div>
        )}
      </div>
      {userId && (
        <div>
          <p className='text-sm font-medium'>User ID</p>
          <p className='text-sm text-muted-foreground'>{userId}</p>
        </div>
      )}

      <hr className='my-4' />
      <SignedIn>
        <SubscriptionDetailsButton
          subscriptionDetailsProps={{
            appearance: dark,
          }}
        >
          <Button variant='outline' size='sm'>
            View Subscription Details
          </Button>
        </SubscriptionDetailsButton>
      </SignedIn>
    </div>
  )
}
