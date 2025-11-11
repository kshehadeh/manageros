import Image from 'next/image'
import { Link } from '@/components/ui/link'

import { FadeInOnScroll } from '@/components/marketing/fade-in'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Why people matter | mpath',
  description:
    'Discover how mpath puts people at the center of everything, connecting their work, feedback, and growth in one unified view.',
}

const narrative = [
  {
    id: 'people-are-the-point',
    text: "Initiatives don't move forward without people. mpath puts every teammate at the center - not as a resource, but as a human. You get a full picture of who they are, how they're doing, and what they're contributing, all in one place.",
    image: '/images/screenshots/ss-people-2.png',
  },
  {
    id: 'context-that-travels',
    text: "Each person's profile becomes a living record: past feedback, 1:1 notes, growth areas, and highlights. You're not scrambling through different docs or Slack threads before a check-in - the context is already there, curated and continuous.",
    image: '/images/screenshots/ss-people-3.png',
  },
  {
    id: 'connected-to-work',
    text: "mpath automatically links people to the initiatives they're involved in, the meetings they've attended, and the tasks they've owned or contributed to. This makes it easy to recognize impact, surface blockers, and spot patterns over time.",
    image: '/images/screenshots/ss-people-4.png',
  },
  {
    id: 'build-relationships',
    text: 'mpath helps managers go beyond status updates. By centralizing everything from feedback to follow-ups, it makes every interaction more meaningful - and keeps the relationship at the core of team health and performance.',
    image: '/images/screenshots/ss-people-1.png',
  },
]

export default function PeopleWhyPage() {
  return (
    <>
      <section className='mx-auto flex w-full max-w-4xl flex-col items-center gap-10 px-6 pb-20 pt-6 text-center sm:px-8 md:pt-24'>
        <FadeInOnScroll>
          <span className='inline-flex items-center justify-center gap-2 self-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/60'>
            PEOPLE ARE THE POINT
          </span>
        </FadeInOnScroll>
        <FadeInOnScroll delay={100}>
          <h1 className='text-center text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl'>
            Put people at the center of everything you do.
          </h1>
        </FadeInOnScroll>
        <FadeInOnScroll delay={200} className='w-full'>
          <p className='mx-auto text-center text-base text-white/70 sm:text-lg'>
            mpath gives you a complete picture of every teammate — their
            contributions, growth, and context — so you can lead with confidence
            and clarity.
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
            Build relationships, not just reports.
          </h2>
        </FadeInOnScroll>
        <FadeInOnScroll delay={200}>
          <p className='max-w-[50vw] text-base text-white/70 sm:text-lg'>
            See every person in full context. mpath brings together their work,
            feedback, and growth so you can be the manager your team deserves.
          </p>
        </FadeInOnScroll>
        <FadeInOnScroll delay={300}>
          <div className='flex flex-wrap items-center justify-center gap-4'>
            <Button
              asChild
              size='lg'
              className='bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(79,70,229,0.45)] transition-all duration-200 hover:-translate-y-0.5'
            >
              <Link href='/auth/signup'>Start managing people in mpath</Link>
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
