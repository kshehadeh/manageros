import Image from 'next/image'
import Link from 'next/link'

import { FadeInOnScroll } from '@/components/marketing/fade-in'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Why initiatives matter | ManagerOS',
  description:
    'Discover how ManagerOS keeps strategic initiatives visible, connected, and moving forward with clarity for every stakeholder.',
}

const narrative = [
  {
    id: 'beyond-tickets',
    text: "Some of the most important work managers oversee doesn’t fit neatly into Jira tickets. Initiatives represent those large-scale, often long-lived efforts that span teams, quarters, or even years — things like Improve Security, Modernize Checkout, or Reduce Tech Debt. They’re broader than epics, and often more conceptual — but they drive real, strategic impact.",
  },
  {
    id: 'proper-home',
    text: 'ManagerOS gives these efforts a proper home.',
  },
  {
    id: 'connected-context',
    text: "Each initiative is more than a label — it connects the objectives that explain why it matters, the tasks that define what’s being done, and the people involved — the who behind the work. It creates a living snapshot of an initiative’s purpose, momentum, and ownership.",
  },
  {
    id: 'shine',
    text: "This is where ManagerOS shines: it pulls initiatives out of the jumble and gives them space to breathe. Instead of getting buried under the noise of day-to-day execution, important efforts stay visible, grounded, and connected to outcomes.",
  },
]

export default function InitiativesWhyPage() {
  return (
    <main className='relative min-h-screen overflow-hidden bg-[#05070f] text-white'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(88,86,255,0.25),_rgba(5,7,15,0))]' />
        <div className='absolute bottom-0 left-1/3 h-[500px] w-[500px] translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.18),_rgba(5,7,15,0))]' />
        <div className='absolute top-1/3 right-0 h-[420px] w-[420px] translate-x-1/3 rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.18),_rgba(5,7,15,0))]' />
      </div>

      <div className='relative z-10'>
        <header className='mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 sm:px-8'>
          <Link href='/' className='flex items-center gap-3'>
            <Image
              src='/images/indigo-logo-white.png'
              alt='ManagerOS Logo'
              width={40}
              height={40}
              className='h-10 w-10'
              priority
            />
            <div>
              <p className='text-lg font-semibold tracking-tight'>ManagerOS</p>
              <p className='text-xs text-white/60'>Built for engineering leaders</p>
            </div>
          </Link>
          <nav className='hidden items-center gap-8 text-sm font-medium text-white/70 md:flex'>
            <Link href='/' className='transition-colors hover:text-white'>
              Home
            </Link>
            <Link href='/#features' className='transition-colors hover:text-white'>
              Features
            </Link>
            <Link href='/#proof' className='transition-colors hover:text-white'>
              Outcomes
            </Link>
            <Link href='/#cta' className='transition-colors hover:text-white'>
              Get Started
            </Link>
          </nav>
          <div className='flex items-center gap-3'>
            <Button
              asChild
              variant='ghost'
              className='text-white/80 hover:text-white'
            >
              <Link href='/auth/signin'>Sign in</Link>
            </Button>
            <Button
              asChild
              className='bg-white text-black shadow-[0_18px_40px_rgba(88,86,255,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90'
            >
              <Link href='/auth/signup'>Register now</Link>
            </Button>
          </div>
        </header>

        <section className='mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 pb-20 pt-16 sm:px-8 md:pt-24'>
          <FadeInOnScroll>
            <span className='inline-flex items-center justify-center gap-2 self-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/60'>
              WHY INITIATIVES MATTER
            </span>
          </FadeInOnScroll>
          <FadeInOnScroll delay={100}>
            <h1 className='text-center text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl'>
              Give strategic initiatives the space they deserve.
            </h1>
          </FadeInOnScroll>
          <FadeInOnScroll delay={200}>
            <p className='text-center text-base text-white/70 sm:text-lg'>
              ManagerOS connects the why, what, and who behind every long-term effort so teams stay aligned on the work that moves the business forward.
            </p>
          </FadeInOnScroll>
        </section>

        <section className='mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pb-16 sm:px-8 md:pb-24'>
          {narrative.map((paragraph, index) => (
            <FadeInOnScroll key={paragraph.id} delay={index * 120}>
              <p className='text-lg leading-relaxed text-white/80 sm:text-xl'>
                {paragraph.text}
              </p>
            </FadeInOnScroll>
          ))}
        </section>

        <section
          id='cta'
          className='mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 pb-24 text-center sm:px-8'
        >
          <FadeInOnScroll delay={100}>
            <h2 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>
              Keep every initiative visible and moving.
            </h2>
          </FadeInOnScroll>
          <FadeInOnScroll delay={200}>
            <p className='max-w-3xl text-base text-white/70 sm:text-lg'>
              Bring clarity to the work that spans quarters, teams, and stakeholders. ManagerOS keeps purpose, progress, and ownership connected so you can drive outcomes with confidence.
            </p>
          </FadeInOnScroll>
          <FadeInOnScroll delay={300}>
            <div className='flex flex-wrap items-center justify-center gap-4'>
              <Button
                asChild
                size='lg'
                className='bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(79,70,229,0.45)] transition-all duration-200 hover:-translate-y-0.5'
              >
                <Link href='/auth/signup'>Start managing initiatives in ManagerOS</Link>
              </Button>
              <Button
                asChild
                size='lg'
                variant='outline'
                className='border-white/20 bg-white/5 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10'
              >
                <Link href='/'>Explore the full platform</Link>
              </Button>
            </div>
          </FadeInOnScroll>
        </section>
      </div>
    </main>
  )
}
