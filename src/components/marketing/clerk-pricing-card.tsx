'use client'

import { Check } from 'lucide-react'
import { Geist_Mono as GeistMono } from 'next/font/google'

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
  planId?: string // Clerk plan ID
  popular?: boolean
  trialBadge?: string
}

export function ClerkPricingCard({
  name,
  price,
  period,
  description,
  features,
  popular = false,
  trialBadge,
}: ClerkPricingCardProps) {
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
          <span className='rounded-full border border-primary/50 bg-primary/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur'>
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
      </div>
    </div>
  )
}
