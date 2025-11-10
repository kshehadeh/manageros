'use client'

import { BarChart3, Users, MessageSquare, CalendarRange } from 'lucide-react'

export function AuthMarketingPanel() {
  const features = [
    {
      name: 'Team clarity at a glance',
      description:
        'See execution, sentiment, and risk signals across every squad in one adaptive dashboard.',
      icon: BarChart3,
    },
    {
      name: 'Coaching superpowers',
      description:
        'Bring context-rich notes, commitments, and AI-assisted follow ups into every 1:1.',
      icon: Users,
    },
    {
      name: 'Continuous feedback loops',
      description:
        'Launch campaigns in minutes, close the loop with nudges, and celebrate growth.',
      icon: MessageSquare,
    },
    {
      name: 'Confident delivery rhythm',
      description:
        'Plan initiatives, surface blockers early, and keep stakeholders aligned.',
      icon: CalendarRange,
    },
  ]

  return (
    <div className='flex flex-col justify-center px-8 py-12 md:px-12 lg:px-8'>
      <div className='mb-8'>
        <h1 className='mb-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl'>
          Lead high-performing engineering teams
        </h1>
        <p className='text-lg text-white/70 sm:text-xl'>
          mpath brings planning, 1:1s, feedback, and delivery signals together
          so engineering managers can lead with confidence.
        </p>
      </div>

      <div className='space-y-6'>
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div key={index} className='flex gap-4'>
              <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10'>
                <Icon className='h-5 w-5 text-white' />
              </div>
              <div>
                <h3 className='mb-1 text-base font-medium text-white'>
                  {feature.name}
                </h3>
                <p className='text-sm text-white/60'>{feature.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
