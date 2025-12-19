'use client'

import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface PlanFeature {
  id: string
  name: string
  description?: string | null
}

export interface PlanCardProps {
  id: string
  name: string
  description?: string | null
  price: string
  priceSubtext?: string
  annualPrice?: string
  annualPriceSubtext?: string
  features: PlanFeature[]
  isCurrentPlan: boolean
  isFree: boolean
  isPopular?: boolean
  billingPeriod: 'month' | 'annual'
  onSelect: (planId: string, period: 'month' | 'annual') => void
  isLoading?: boolean
  disabled?: boolean
}

export function PlanCard({
  id,
  name,
  description,
  price,
  priceSubtext,
  annualPrice,
  annualPriceSubtext,
  features,
  isCurrentPlan,
  isFree,
  isPopular,
  billingPeriod,
  onSelect,
  isLoading,
  disabled,
}: PlanCardProps) {
  const displayPrice =
    billingPeriod === 'annual' && annualPrice ? annualPrice : price
  const displayPriceSubtext =
    billingPeriod === 'annual' && annualPriceSubtext
      ? annualPriceSubtext
      : priceSubtext

  const handleSelect = () => {
    if (!isCurrentPlan && !disabled) {
      onSelect(id, billingPeriod)
    }
  }

  return (
    <Card
      className={cn(
        'relative flex flex-col transition-all',
        isCurrentPlan && 'border-primary ring-2 ring-primary/20',
        isPopular && !isCurrentPlan && 'border-purple-500/50'
      )}
    >
      {isCurrentPlan && (
        <Badge
          className='absolute -top-3 left-1/2 -translate-x-1/2 bg-primary'
          variant='default'
        >
          Current Plan
        </Badge>
      )}
      {isPopular && !isCurrentPlan && (
        <Badge
          className='absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500'
          variant='default'
        >
          <Sparkles className='mr-1 h-3 w-3' />
          Popular
        </Badge>
      )}

      <CardHeader className='text-center'>
        <CardTitle className='text-xl'>{name}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        <div className='mt-4'>
          <span className='text-4xl font-bold'>{displayPrice}</span>
          {displayPriceSubtext && (
            <span className='text-muted-foreground ml-1'>
              {displayPriceSubtext}
            </span>
          )}
        </div>
        {billingPeriod === 'annual' && !isFree && (
          <p className='text-sm text-muted-foreground mt-1'>Billed annually</p>
        )}
      </CardHeader>

      <CardContent className='flex-1'>
        <ul className='space-y-3'>
          {features.map(feature => (
            <li key={feature.id} className='flex items-start gap-2'>
              <Check className='h-5 w-5 text-primary shrink-0 mt-0.5' />
              <span className='text-sm'>{feature.name}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className='w-full'
          variant={isCurrentPlan ? 'outline' : 'default'}
          onClick={handleSelect}
          disabled={isCurrentPlan || isLoading || disabled}
        >
          {isLoading
            ? 'Loading...'
            : isCurrentPlan
              ? 'Current Plan'
              : isFree
                ? 'Downgrade'
                : 'Upgrade'}
        </Button>
      </CardFooter>
    </Card>
  )
}
