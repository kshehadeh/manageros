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
    text: "Some of the most important work managers oversee doesn't fit neatly into Jira tickets. Initiatives represent those large-scale, often long-lived efforts that span teams, quarters, or even years — things like Improve Security, Modernize Checkout, or Reduce Tech Debt. They're broader than epics, and often more conceptual — but they drive real, strategic impact.",
    image: '/images/screenshots/ss-initiative-1.png',
  },
  {
    id: 'connected-context',
    text: "Each initiative is more than a label — it connects the objectives that explain why it matters, the tasks that define what's being done, and the people involved — the who behind the work. It creates a living snapshot of an initiative's purpose, momentum, and ownership.",
    image: '/images/screenshots/ss-initiative-2.png',
  },
  {
    id: 'shine',
    text: 'This is where ManagerOS shines: it pulls initiatives out of the jumble and gives them space to breathe. Instead of getting buried under the noise of day-to-day execution, important efforts stay visible, grounded, and connected to outcomes.',
    image: '/images/screenshots/ss-initiative-3.png',
  },
]

export default function InitiativesWhyPage() {
  return (
    <>
      <section className='mx-auto flex w-full max-w-4xl flex-col items-center gap-10 px-6 pb-20 pt-16 text-center sm:px-8 md:pt-24'>
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
        <FadeInOnScroll delay={200} className='w-full'>
          <p className='mx-auto text-center text-base text-white/70 sm:text-lg'>
            ManagerOS connects the why, what, and who behind every long-term
            effort so teams stay aligned on the work that moves the business
            forward.
          </p>
        </FadeInOnScroll>
      </section>

      <section className='mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-16 sm:px-8 md:pb-24'>
        {narrative.map((item, index) => (
          <div
            key={item.id}
            className={`flex flex-col items-center gap-8 md:flex-row md:gap-12 ${
              index % 2 === 1 ? 'md:flex-row-reverse' : ''
            }`}
          >
            <div className='flex-1'>
              <FadeInOnScroll delay={index * 120}>
                <p className='text-lg leading-relaxed text-white/80 sm:text-xl'>
                  {item.text}
                </p>
              </FadeInOnScroll>
            </div>
            <div className='flex-1'>
              <FadeInOnScroll delay={index * 120 + 60}>
                <div className='relative overflow-hidden rounded-lg'>
                  {/* Glow effect */}
                  <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-blue-500/20 blur-3xl' />
                  {/* Image with glow border */}
                  <Image
                    src={item.image}
                    alt={item.text}
                    width={800}
                    height={450}
                    className='relative rounded-lg border border-white/10 shadow-[0_0_40px_rgba(88,86,255,0.3)] h-full object-cover aspect-video w-full'
                  />
                </div>
              </FadeInOnScroll>
            </div>
          </div>
        ))}
      </section>

      <section
        id='cta'
        className='mx-auto flex w-full flex-col items-center gap-6 px-6 pb-24 text-center sm:px-8'
      >
        <FadeInOnScroll delay={100}>
          <h2 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>
            Keep every initiative visible and moving.
          </h2>
        </FadeInOnScroll>
        <FadeInOnScroll delay={200}>
          <p className='max-w-[50vw] text-base text-white/70 sm:text-lg'>
            Bring clarity to the work that spans quarters, teams, and
            stakeholders. ManagerOS keeps purpose, progress, and ownership
            connected so you can drive outcomes with confidence.
          </p>
        </FadeInOnScroll>
        <FadeInOnScroll delay={300}>
          <div className='flex flex-wrap items-center justify-center gap-4'>
            <Button
              asChild
              size='lg'
              className='bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(79,70,229,0.45)] transition-all duration-200 hover:-translate-y-0.5'
            >
              <Link href='/auth/signup'>
                Start managing initiatives in ManagerOS
              </Link>
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
    </>
  )
}
