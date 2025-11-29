import { FadeInOnScroll } from '@/components/marketing/fade-in'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { Metadata } from 'next'
import { Geist_Mono as GeistMono } from 'next/font/google'
import { ClerkPricingCard } from '@/components/marketing/clerk-pricing-card'
import { getClerkBillingPlans } from '@/lib/clerk'
import type { ClerkCommercePlan } from '@/lib/clerk-types'
import { ArrowRight } from 'lucide-react'

const geistMono = GeistMono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Pricing | mpath',
  description:
    'Choose the right plan for your engineering team. Start free with Solo or unlock unlimited features with Orchestrator.',
}

/**
 * Transform a Clerk plan into props for ClerkPricingCard
 */
function transformPlanToCardProps(plan: ClerkCommercePlan, index: number) {
  const hasFreeTrial =
    plan.free_trial_enabled && plan.free_trial_days && plan.free_trial_days > 0

  // Extract feature names from plan features
  const features = plan.features?.map(f => f.name) ?? []

  return {
    name: plan.name,
    price: plan.fee.amount_formatted,
    period: plan.is_recurring ? '/month' : undefined,
    description: plan.description ?? '',
    features,
    planId: plan.id,
    popular: index === 1, // Mark second plan as popular (typically the paid plan)
    trialBadge: hasFreeTrial
      ? `${plan.free_trial_days}-day free trial`
      : undefined,
  }
}

export default async function PricingPage() {
  // Fetch plans from Clerk
  const clerkPlans = await getClerkBillingPlans()

  // Transform Clerk plans to card props
  const pricingTiers = clerkPlans.map((plan, index) =>
    transformPlanToCardProps(plan, index)
  )

  return (
    <>
      <section className='mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 pb-20 pt-6 text-center sm:px-8 md:pt-24'>
        <FadeInOnScroll>
          <span className='inline-flex items-center justify-center gap-2 self-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/60'>
            SIMPLE, TRANSPARENT PRICING
          </span>
        </FadeInOnScroll>
        <FadeInOnScroll delay={100}>
          <h1
            className={`text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl ${geistMono.className}`}
          >
            Choose the plan that fits your team
          </h1>
        </FadeInOnScroll>
        <FadeInOnScroll delay={200}>
          <p className='mx-auto text-base text-white/70 sm:text-lg'>
            Plans are tied to organizations, not individual users. You can sign
            up and create an organization first, then choose a plan later. All
            team members in your organization will share the same plan.{' '}
          </p>
        </FadeInOnScroll>
        <FadeInOnScroll delay={300}>
          <Button
            asChild
            size='lg'
            className='mx-auto w-fit bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(79,70,229,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90'
          >
            <Link href='/auth/signup'>
              Get started free
              <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        </FadeInOnScroll>
      </section>

      <section className='mx-auto max-w-6xl px-6 pb-24 sm:px-8'>
        <FadeInOnScroll delay={350}>
          <div className='grid gap-8 md:grid-cols-2'>
            {pricingTiers.map(tier => (
              <ClerkPricingCard key={tier.name} {...tier} />
            ))}
          </div>
        </FadeInOnScroll>
      </section>

      <section className='mx-auto max-w-4xl px-6 pb-24 sm:px-8'>
        <FadeInOnScroll className='rounded-3xl border border-white/10 bg-white/[0.06] p-10 text-center shadow-[0_28px_70px_rgba(7,16,29,0.55)] backdrop-blur'>
          <div className='space-y-6'>
            <h2
              className={`text-3xl font-semibold text-white sm:text-4xl ${geistMono.className}`}
            >
              Questions about pricing?
            </h2>
            <p className='mx-auto text-base text-white/70'>
              We're here to help. Contact us to discuss your team's needs and
              find the perfect plan.
            </p>
            <Button
              asChild
              size='lg'
              variant='outline'
              className='border-white/20 bg-white/10 text-white/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:text-white'
            >
              <Link href='mailto:hello@mpath.dev'>Contact us</Link>
            </Button>
          </div>
        </FadeInOnScroll>
      </section>
    </>
  )
}
