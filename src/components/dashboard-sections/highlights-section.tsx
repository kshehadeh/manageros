import { AlertCircle, Calendar, Users, ClipboardCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface HighlightsSectionProps {
  overdueTasksCount: number
  upcomingOneOnOnesCount: number
  upcomingMeetingsCount: number
  reviewsDueCount: number
}

export function HighlightsSection({
  overdueTasksCount,
  upcomingOneOnOnesCount,
  upcomingMeetingsCount,
  reviewsDueCount,
}: HighlightsSectionProps) {
  const highlights = [
    {
      count: overdueTasksCount,
      label: overdueTasksCount === 1 ? 'overdue task' : 'overdue tasks',
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/5',
      href: '/my-tasks',
    },
    {
      count: upcomingOneOnOnesCount,
      label: upcomingOneOnOnesCount === 1 ? 'upcoming 1:1' : 'upcoming 1:1s',
      icon: Users,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/5',
      href: '/oneonones',
    },
    {
      count: upcomingMeetingsCount,
      label: upcomingMeetingsCount === 1 ? 'upcoming meeting' : 'upcoming meetings',
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/5',
      href: '/meetings',
    },
    {
      count: reviewsDueCount,
      label: reviewsDueCount === 1 ? 'review due' : 'reviews due',
      icon: ClipboardCheck,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/5',
      href: '/feedback-campaigns',
    },
  ]

  return (
    <div className='space-y-4'>
      <h2 className='text-lg font-semibold'>Highlights</h2>
      <div className='flex flex-wrap gap-3'>
        {highlights.map((highlight, index) => (
          <Link key={index} href={highlight.href}>
            <Card
              className={`flex items-center gap-2 px-4 py-2 ${highlight.bgColor} border-0 rounded-md shadow-none cursor-pointer hover:opacity-80 transition-opacity`}
            >
              <div className={`${highlight.color} flex items-center justify-center`}>
                <highlight.icon className='h-4 w-4' />
              </div>
              <span className='text-sm font-medium'>
                {highlight.count} {highlight.label}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
