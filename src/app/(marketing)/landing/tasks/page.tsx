import Image from 'next/image'
import Link from 'next/link'

import { FadeInOnScroll } from '@/components/marketing/fade-in'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Why tasks matter | mpath',
  description:
    'Discover how mpath makes task management simple, connected, and actionable with quick creation and seamless integration.',
}

const narrative = [
  {
    id: 'tasks-with-purpose',
    text: 'Tasks in mpath are more than checkboxes. Assign ownership, set priorities, track status, and add estimates — all while keeping tasks connected to the bigger picture. Whether it is a quick follow-up or a multi-week deliverable, every task has clear ownership and purpose.',
    image: '/images/screenshots/ss-tasks-1.png',
  },
  {
    id: 'connected-to-initiatives',
    text: 'Tasks link directly to initiatives, bringing strategic work down to actionable steps. See which tasks move initiatives forward, track progress across objectives, and maintain clarity on what matters. When initiatives evolve, tasks stay aligned.',
    image: '/images/screenshots/ss-tasks-3.png',
  },
  {
    id: 'create-anywhere',
    text: "Press Q from anywhere in mpath and create a task instantly. Whether you are reviewing an initiative, in a meeting, or on someone's profile, capture work immediately — no context switching, no navigation. mpath makes task creation as simple as remembering what needs to be done.",
    image: '/images/screenshots/ss-tasks-2.png',
  },
]

export default function TasksWhyPage() {
  return (
    <>
      <section className='mx-auto flex w-full max-w-4xl flex-col items-center gap-10 px-6 pb-20 pt-6 text-center sm:px-8 md:pt-24'>
        <FadeInOnScroll>
          <span className='inline-flex items-center justify-center gap-2 self-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/60'>
            TASKS ARE EVERYWHERE
          </span>
        </FadeInOnScroll>
        <FadeInOnScroll delay={100}>
          <h1 className='text-center text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl'>
            Turn plans into action, anywhere.
          </h1>
        </FadeInOnScroll>
        <FadeInOnScroll delay={200} className='w-full'>
          <p className='mx-auto text-center text-base text-white/70 sm:text-lg'>
            mpath makes task management simple, connected, and instant — from
            strategic initiatives to quick follow-ups, capture and track
            everything that matters.
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
            Capture work instantly, track it everywhere.
          </h2>
        </FadeInOnScroll>
        <FadeInOnScroll delay={200}>
          <p className='max-w-[50vw] text-base text-white/70 sm:text-lg'>
            From quick follow-ups to strategic deliverables, mpath makes task
            management seamless. Create tasks from anywhere, link them to
            initiatives, and watch them become action.
          </p>
        </FadeInOnScroll>
        <FadeInOnScroll delay={300}>
          <div className='flex flex-wrap items-center justify-center gap-4'>
            <Button
              asChild
              size='lg'
              className='bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(79,70,229,0.45)] transition-all duration-200 hover:-translate-y-0.5'
            >
              <Link href='/auth/signup'>Start managing tasks in mpath</Link>
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
