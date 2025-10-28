import Image from 'next/image'
import Link from 'next/link'

import { FadeInOnScroll } from '@/components/marketing/fade-in'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Why meetings matter | ManagerOS',
  description:
    'Discover how ManagerOS transforms meetings from disconnected calendar events into connected, productive sessions with context and follow-through.',
}

const narrative = [
  {
    id: 'meetings-with-context',
    text: 'Most meeting tools treat each event as an isolated appointment. ManagerOS builds meetings into the fabric of your work. Link sessions to initiatives they discuss, track decisions, and connect outcomes to the people who need to follow through. Every meeting has purpose beyond the time slot.',
    image: '/images/screenshots/ss-meeting-1.png',
  },
  {
    id: 'track-what-matters',
    text: "From one-time sessions to recurring series, ManagerOS makes meeting management simple. Invite participants, track their responses, take notes that stay attached to the work, and generate instances automatically for recurring schedules. The meeting doesn't end when the call does — the context lives on.",
    image: '/images/screenshots/ss-meeting-2.png',
  },
  {
    id: 'connected-to-everything',
    text: "ManagerOS connects meetings to the rest of your team's work. Participants are linked to their contributions, initiatives are tied to discussions about them, and outcomes become actionable. No more wondering what was decided or who committed to what — it's all there, linked and searchable.",
    image: '/images/screenshots/ss-meeting-3.png',
  },
  {
    id: 'recurring-that-make-sense',
    text: 'Stop managing recurring meetings as disconnected calendar entries. ManagerOS generates individual instances for each occurrence, letting you track attendance, capture unique notes, and manage the series as a whole. One-on-ones, team stand-ups, project syncs — they all fit naturally into your workflow.',
    image: '/images/screenshots/ss-meeting-4.png',
  },
]

export default function MeetingsWhyPage() {
  return (
    <>
      <section className='mx-auto flex w-full max-w-4xl flex-col items-center gap-10 px-6 pb-20 pt-16 text-center sm:px-8 md:pt-24'>
        <FadeInOnScroll>
          <span className='inline-flex items-center justify-center gap-2 self-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/60'>
            WHY MEETINGS MATTER
          </span>
        </FadeInOnScroll>
        <FadeInOnScroll delay={100}>
          <h1 className='text-center text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl'>
            Turn meetings into connected, actionable sessions.
          </h1>
        </FadeInOnScroll>
        <FadeInOnScroll delay={200} className='w-full'>
          <p className='mx-auto text-center text-base text-white/70 sm:text-lg'>
            ManagerOS transforms meetings from standalone events into
            integrated, context-rich sessions that drive work forward and keep
            everyone aligned.
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
            Make every meeting count.
          </h2>
        </FadeInOnScroll>
        <FadeInOnScroll delay={200}>
          <p className='max-w-[50vw] text-base text-white/70 sm:text-lg'>
            Connect meetings to the work they discuss. ManagerOS ensures nothing
            gets lost in translation, with context that outlives the call and
            outcomes that become action.
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
                Start managing meetings in ManagerOS
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
