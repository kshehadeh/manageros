'use client'

import { CheckoutButton } from '@clerk/nextjs/experimental'
import { Check, ArrowRight } from 'lucide-react'
import { Geist_Mono as GeistMono } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SignedIn } from '@clerk/nextjs'

const geistMono = GeistMono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

interface ClerkPricingCardProps {
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  cta: string
  planId?: string // Clerk plan ID
  isFree: boolean
  popular?: boolean
  trialBadge?: string
}

export function ClerkPricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  planId,
  isFree,
  popular = false,
  trialBadge,
}: ClerkPricingCardProps) {
  const router = useRouter()

  // For free plans, use regular button that redirects to signup
  if (isFree) {
    return (
      <div
        className={`relative rounded-3xl border p-8 text-left transition-all duration-300 ${
          popular
            ? 'border-primary/50 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-[0_25px_60px_rgba(79,70,229,0.35)] backdrop-blur'
            : 'border-white/10 bg-white/[0.03] shadow-[0_22px_45px_rgba(7,16,29,0.35)] backdrop-blur'
        }`}
      >
        <div className='space-y-6'>
          <div>
            <h3
              className={`text-2xl font-semibold text-white ${geistMono.className}`}
            >
              {name}
            </h3>
            <p className='mt-2 text-sm text-white/70'>{description}</p>
          </div>
          <div className='flex items-baseline gap-2'>
            <span
              className={`text-5xl font-bold text-white ${geistMono.className}`}
            >
              {price}
            </span>
            {period && <span className='text-lg text-white/60'>{period}</span>}
          </div>
          <ul className='space-y-4'>
            {features.map(feature => (
              <li key={feature} className='flex items-start gap-3'>
                <Check className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
                <span className='text-sm text-white/80'>{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            onClick={() => router.push('/auth/signup')}
            size='lg'
            className={`w-full transition-all duration-200 ${
              popular
                ? 'bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(79,70,229,0.45)] hover:-translate-y-0.5 hover:bg-primary/90'
                : 'border-white/20 bg-white/5 text-white/80 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/10 hover:text-white'
            }`}
            variant={popular ? 'default' : 'outline'}
          >
            {cta}
            <ArrowRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
    )
  }

  // For paid plans, use Clerk's CheckoutButton
  if (!planId) {
    // Fallback if plan ID is not configured
    return (
      <div
        className={`relative rounded-3xl border p-8 text-left transition-all duration-300 ${
          popular
            ? 'border-primary/50 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-[0_25px_60px_rgba(79,70,229,0.35)] backdrop-blur'
            : 'border-white/10 bg-white/[0.03] shadow-[0_22px_45px_rgba(7,16,29,0.35)] backdrop-blur'
        }`}
      >
        <div className='space-y-6'>
          <div>
            <h3
              className={`text-2xl font-semibold text-white ${geistMono.className}`}
            >
              {name}
            </h3>
            <p className='mt-2 text-sm text-white/70'>{description}</p>
          </div>
          <div className='flex items-baseline gap-2'>
            <span
              className={`text-5xl font-bold text-white ${geistMono.className}`}
            >
              {price}
            </span>
            {period && <span className='text-lg text-white/60'>{period}</span>}
          </div>
          <ul className='space-y-4'>
            {features.map(feature => (
              <li key={feature} className='flex items-start gap-3'>
                <Check className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
                <span className='text-sm text-white/80'>{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            onClick={() => router.push('/auth/signup')}
            size='lg'
            className={`w-full transition-all duration-200 ${
              popular
                ? 'bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(79,70,229,0.45)] hover:-translate-y-0.5 hover:bg-primary/90'
                : 'border-white/20 bg-white/5 text-white/80 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/10 hover:text-white'
            }`}
            variant={popular ? 'default' : 'outline'}
          >
            {cta}
            <ArrowRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative rounded-3xl border p-8 text-left transition-all duration-300 ${
        popular
          ? 'border-primary/50 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-[0_25px_60px_rgba(79,70,229,0.35)] backdrop-blur'
          : 'border-white/10 bg-white/[0.03] shadow-[0_22px_45px_rgba(7,16,29,0.35)] backdrop-blur'
      }`}
    >
      {popular && trialBadge && (
        <div className='absolute -top-4 left-1/2 -translate-x-1/2'>
          <span className='rounded-full border border-primary/50 bg-primary/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground backdrop-blur'>
            {trialBadge}
          </span>
        </div>
      )}
      <div className='space-y-6'>
        <div>
          <h3
            className={`text-2xl font-semibold text-white ${geistMono.className}`}
          >
            {name}
          </h3>
          <p className='mt-2 text-sm text-white/70'>{description}</p>
        </div>
        <div className='flex items-baseline gap-2'>
          <span
            className={`text-5xl font-bold text-white ${geistMono.className}`}
          >
            {price}
          </span>
          {period && <span className='text-lg text-white/60'>{period}</span>}
        </div>
        <ul className='space-y-4'>
          {features.map(feature => (
            <li key={feature} className='flex items-start gap-3'>
              <Check className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
              <span className='text-sm text-white/80'>{feature}</span>
            </li>
          ))}
        </ul>
        <div
          className={`w-full [&_button]:w-full [&_button]:transition-all [&_button]:duration-200 [&_button]:h-10 [&_button]:px-4 [&_button]:py-2 [&_button]:rounded-md [&_button]:font-medium [&_button]:flex [&_button]:items-center [&_button]:justify-center [&_button]:gap-2 ${
            popular
              ? '[&_button]:bg-primary [&_button]:text-primary-foreground [&_button]:shadow-[0_18px_40px_rgba(79,70,229,0.45)] [&_button]:hover:-translate-y-0.5 [&_button]:hover:bg-primary/90'
              : '[&_button]:border [&_button]:border-white/20 [&_button]:bg-white/5 [&_button]:text-white/80 [&_button]:hover:-translate-y-0.5 [&_button]:hover:border-white/40 [&_button]:hover:bg-white/10 [&_button]:hover:text-white'
          }`}
        >
          <SignedIn>
            <CheckoutButton planId={planId} />
          </SignedIn>
        </div>
      </div>
    </div>
  )
}
