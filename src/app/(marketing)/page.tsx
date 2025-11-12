import { Link } from '@/components/ui/link'
import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  MessageSquare,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeInOnScroll } from '@/components/marketing/fade-in'
import { CurrentYear } from '@/components/marketing/current-year'
import { Metadata } from 'next'

const featureHighlights = [
  {
    name: 'Team clarity at a glance',
    description:
      'See execution, sentiment, and risk signals across every squad in one adaptive dashboard so you always know where to lean in.',
    icon: BarChart3,
  },
  {
    name: 'Coaching superpowers',
    description:
      'Bring context-rich notes, commitments, and AI-assisted follow ups into every 1:1 without digging through docs and scattered tools.',
    icon: Users,
  },
  {
    name: 'Continuous feedback loops',
    description:
      'Launch campaigns in minutes, close the loop with nudges, and celebrate growth with stories your engineers actually feel.',
    icon: MessageSquare,
  },
  {
    name: 'Confident delivery rhythm',
    description:
      'Plan initiatives, surface blockers early, and keep stakeholders aligned with living roadmaps that stay current automatically.',
    icon: CalendarRange,
  },
]

const proofPoints = [
  {
    title: 'Fewer surprise escalations',
    description:
      'Detect delivery and morale drift before it hits the sprint review.',
  },
  {
    title: 'Time back for coaching',
    description:
      'Reclaim hours each week by automating prep and follow-up workflows.',
  },
  {
    title: 'Happier engineering teams',
    description:
      'Celebrate wins, catch burnout signals, and keep career conversations moving.',
  },
]

export const metadata: Metadata = {
  title: 'Lead high-performing engineering teams | mpath',
  description:
    'mpath gives engineering managers a unified operating system for clarity, coaching, and continuous improvement across their teams.',
}

export default async function MarketingHome() {
  return (
    <>
      <section className='mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 pb-20 pt-6 text-center sm:px-8 md:pt-24'>
        <FadeInOnScroll>
          <span className='inline-flex items-center justify-center gap-2 self-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/60'>
            ENGINEERING MANAGEMENT, ELEVATED
          </span>
        </FadeInOnScroll>
        <FadeInOnScroll delay={100}>
          <h1 className='text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl'>
            Give your teams clarity, coaching, and momentum in one operating
            system.
          </h1>
        </FadeInOnScroll>
        <FadeInOnScroll delay={200}>
          <p className='mx-auto max-w-4xl text-base text-white/70 sm:text-lg'>
            mpath brings planning, 1:1s, feedback, and delivery signals together
            so engineering managers can lead with confidence—not spreadsheets.
            Stay aligned, move faster, and grow people without losing sight of
            execution.
          </p>
        </FadeInOnScroll>
        <FadeInOnScroll delay={300}>
          <div className='flex flex-wrap items-center justify-center gap-4'>
            <Button
              asChild
              size='lg'
              className='bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(79,70,229,0.45)] transition-all duration-200 hover:-translate-y-0.5'
            >
              <Link href='/auth/signup' className='flex items-center gap-2'>
                Start building your rhythm
                <ArrowRight className='h-4 w-4' />
              </Link>
            </Button>
            <Button
              asChild
              size='lg'
              variant='outline'
              className='border-white/20 bg-white/5 text-white/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:text-white'
            >
              <Link href='/pricing'>View pricing</Link>
            </Button>
          </div>
        </FadeInOnScroll>
        <FadeInOnScroll delay={400}>
          <nav className='flex flex-wrap items-center justify-center gap-6 text-sm text-white/70'>
            <Link
              href='#features'
              className='transition-colors hover:text-white'
            >
              Features
            </Link>
            <Link href='#proof' className='transition-colors hover:text-white'>
              Outcomes
            </Link>
            <Link href='#cta' className='transition-colors hover:text-white'>
              Get Started
            </Link>
          </nav>
        </FadeInOnScroll>
      </section>

      <section id='features' className='mx-auto max-w-6xl px-6 pb-24 sm:px-8'>
        <FadeInOnScroll className='rounded-3xl border border-white/5 bg-white/[0.03] p-10 shadow-[0_25px_60px_rgba(7,16,29,0.45)] backdrop-blur'>
          <div className='grid gap-10 md:grid-cols-[1.3fr_1fr] md:items-center'>
            <div className='space-y-6'>
              <p className='text-sm font-semibold uppercase tracking-[0.3em] text-white/60'>
                Why teams choose mpath
              </p>
              <h2 className='text-3xl font-semibold text-white sm:text-4xl'>
                Operational calm meets empowered engineering teams.
              </h2>
              <p className='text-base text-white/70'>
                Replace fragmented workflows with a single space designed for
                engineering managers. Every interaction—planning, coaching, and
                communicating—stays connected so you can focus on outcomes, not
                orchestration.
              </p>
              <div className='grid gap-4 sm:grid-cols-2'>
                {featureHighlights.map((feature, index) => (
                  <FadeInOnScroll
                    key={feature.name}
                    delay={index * 80}
                    className='rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition-colors duration-300 hover:border-white/30'
                  >
                    <feature.icon className='mb-4 h-8 w-8 text-white' />
                    <h3 className='text-lg font-semibold text-white'>
                      {feature.name}
                    </h3>
                    <p className='mt-2 text-sm text-white/70'>
                      {feature.description}
                    </p>
                  </FadeInOnScroll>
                ))}
              </div>
            </div>
            <div className='flex flex-col gap-4 rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/10 via-emerald-500/10 to-transparent p-6 text-left shadow-[0_18px_50px_rgba(6,95,70,0.35)] backdrop-blur'>
              <div className='flex items-center gap-3 text-emerald-200'>
                <ShieldCheck className='h-6 w-6' />
                <span className='text-sm font-medium uppercase tracking-[0.25em]'>
                  Built for focus
                </span>
              </div>
              <p className='text-lg font-semibold text-white'>
                Your weekly workflow, from Monday kickoff to Friday retros, in a
                single calm surface.
              </p>
              <p className='text-sm text-emerald-100/80'>
                Integrates with the tools you already love. Stay in flow with
                minimal setup and effortless onboarding for your leads.
              </p>
            </div>
          </div>
        </FadeInOnScroll>
      </section>

      <section id='proof' className='mx-auto max-w-6xl px-6 pb-24 sm:px-8'>
        <div className='grid gap-8 md:grid-cols-3'>
          {proofPoints.map((point, index) => (
            <FadeInOnScroll
              key={point.title}
              delay={index * 120}
              className='rounded-2xl border border-white/5 bg-white/[0.04] p-6 shadow-[0_22px_45px_rgba(7,16,29,0.35)] backdrop-blur'
            >
              <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary/60'>
                Outcome
              </p>
              <h3 className='mt-3 text-xl font-semibold text-white'>
                {point.title}
              </h3>
              <p className='mt-2 text-sm text-white/70'>{point.description}</p>
            </FadeInOnScroll>
          ))}
        </div>
      </section>

      <section id='cta' className='mx-auto max-w-4xl px-6 pb-24 sm:px-8'>
        <FadeInOnScroll className='relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-10 text-center shadow-[0_28px_70px_rgba(7,16,29,0.55)] backdrop-blur'>
          <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08),_rgba(255,255,255,0))]' />
          <div className='relative space-y-6'>
            <p className='text-sm font-semibold uppercase tracking-[0.35em] text-white/60'>
              Ready when you are
            </p>
            <h2 className='text-3xl font-semibold text-white sm:text-4xl'>
              Bring harmony to how your engineering teams deliver.
            </h2>
            <p className='mx-auto max-w-4xl text-base text-white/70'>
              Get started with mpath today. Invite your leads, connect your
              rituals, and see how a shared operating system transforms the way
              you support engineers.
            </p>
            <div className='flex flex-wrap items-center justify-center gap-4'>
              <Button
                asChild
                size='lg'
                className='bg-white text-black shadow-[0_18px_40px_rgba(148,163,255,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90'
              >
                <Link href='/auth/signup' className='flex items-center gap-2'>
                  Get started
                  <ArrowRight className='h-4 w-4' />
                </Link>
              </Button>
              <Button
                asChild
                size='lg'
                variant='outline'
                className='border-white/20 bg-white/10 text-white/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:text-white'
              >
                <Link href='/auth/signin'>Talk with us</Link>
              </Button>
            </div>
          </div>
        </FadeInOnScroll>
      </section>

      <footer className='border-t border-white/10 bg-black/20'>
        <div className='mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-white/50 sm:flex-row sm:px-8'>
          <p>
            © <CurrentYear /> mpath. Designed for engineering leaders.
          </p>
          <div className='flex items-center gap-6'>
            <Link
              href='/auth/signup'
              className='transition-colors hover:text-white'
            >
              Register
            </Link>
            <Link
              href='/auth/signin'
              className='transition-colors hover:text-white'
            >
              Sign in
            </Link>
            <Link
              href='mailto:hello@manageros.com'
              className='transition-colors hover:text-white'
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </>
  )
}
