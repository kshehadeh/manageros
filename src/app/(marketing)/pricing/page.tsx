import { FadeInOnScroll } from '@/components/marketing/fade-in'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { Metadata } from 'next'
import { Geist_Mono as GeistMono } from 'next/font/google'
import { PricingTable } from '@clerk/nextjs'

const geistMono = GeistMono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Pricing | mpath',
  description:
    'Choose the right plan for your engineering team. Start free with Solo or unlock unlimited features with Orchestrator.',
}

export default function PricingPage() {
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
            Start free with Solo, or unlock unlimited scale with Orchestrator.
            All plans include our full suite of engineering management tools.
          </p>
        </FadeInOnScroll>
      </section>

      <section className='mx-auto max-w-6xl px-6 pb-24 sm:px-8'>
        <PricingTable />
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
              <Link href='mailto:hello@manageros.com'>Contact us</Link>
            </Button>
          </div>
        </FadeInOnScroll>
      </section>
    </>
  )
}
