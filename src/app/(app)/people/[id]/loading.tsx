import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeader } from '@/components/ui/section-header'
import {
  CalendarDays,
  User as UserIcon,
  Building2,
  Briefcase,
  MessageCircle,
  Handshake,
  Rocket,
  ListTodo,
  Users,
} from 'lucide-react'

export default function LoadingPage() {
  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-2'>
              <Skeleton className='h-16 w-16 rounded-full' />
              <div className='flex items-center gap-3'>
                <Skeleton className='h-8 w-48' />
                <Skeleton className='h-6 w-20 rounded-full' />
              </div>
            </div>
            <Skeleton className='h-5 w-32 mb-2' />
            <Skeleton className='h-4 w-40 mb-3' />

            {/* Basic Information with Icons */}
            <div className='flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground'>
              <div className='flex items-center gap-1'>
                <Building2 className='w-4 h-4' />
                <Skeleton className='h-4 w-24' />
              </div>
              <div className='flex items-center gap-1'>
                <UserIcon className='w-4 h-4' />
                <Skeleton className='h-4 w-28' />
              </div>
              <div className='flex items-center gap-1'>
                <Briefcase className='w-4 h-4' />
                <Skeleton className='h-4 w-20' />
              </div>
              <div className='flex items-center gap-1'>
                <CalendarDays className='w-4 h-4' />
                <Skeleton className='h-4 w-32' />
              </div>
              <div className='flex items-center gap-1'>
                <MessageCircle className='w-4 h-4' />
                <Skeleton className='h-4 w-24' />
              </div>
            </div>
          </div>
          <Skeleton className='h-9 w-9 rounded-md' />
        </div>
      </div>

      <div className='flex flex-col lg:flex-row gap-6'>
        {/* Main Content */}
        <div className='flex-1 space-y-6'>
          {/* Feedback Campaigns Section */}
          <section className='rounded-xl py-4 -mx-3 px-3 space-y-4'>
            <div className='flex items-center justify-between border-b border-muted pb-3 mb-3 -mx-3 px-3 md:mx-0 md:px-0'>
              <SectionHeader
                icon={MessageCircle}
                title='Feedback Campaigns (0)'
                action={
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-8 w-8' />
                    <Skeleton className='h-8 w-8' />
                  </div>
                }
              />
            </div>
            <div className='space-y-3'>
              <Skeleton className='h-24 w-full rounded-lg' />
            </div>
          </section>

          {/* Feedback Section */}
          <section className='rounded-xl py-4 -mx-3 px-3 space-y-4'>
            <div className='flex items-center justify-between border-b border-muted pb-3 mb-3 -mx-3 px-3 md:mx-0 md:px-0'>
              <h3 className='font-bold flex items-center gap-2'>
                <MessageCircle className='w-4 h-4' />
                Recent Feedback
              </h3>
              <Skeleton className='h-8 w-20' />
            </div>
            <div className='space-y-0 divide-y'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i.toString()}
                  className='flex items-start gap-3 px-3 py-3'
                >
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <Skeleton className='h-3 w-16' />
                      <Skeleton className='h-4 w-12 rounded-full' />
                    </div>
                    <Skeleton className='h-4 w-full mb-2' />
                    <Skeleton className='h-4 w-3/4 mb-1' />
                    <div className='flex items-center gap-2'>
                      <Skeleton className='h-3 w-24' />
                      <Skeleton className='h-3 w-2' />
                      <Skeleton className='h-3 w-32' />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Owned Initiatives */}
          <section className='rounded-xl py-4 -mx-3 px-3 space-y-4'>
            <div className='flex items-center justify-between border-b border-muted pb-3 mb-3 -mx-3 px-3 md:mx-0 md:px-0'>
              <h3 className='font-bold flex items-center gap-2'>
                <Rocket className='w-4 h-4' />
                Owned Initiatives
              </h3>
            </div>
            <div className='space-y-0 divide-y'>
              {Array.from({ length: 3 }).map(i => (
                <div
                  key={i}
                  className='flex items-center justify-between px-3 py-3'
                >
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <Skeleton className='h-4 w-48' />
                    </div>
                    <div className='flex items-center gap-2'>
                      <Skeleton className='h-5 w-16 rounded-full' />
                      <Skeleton className='h-3 w-3' />
                      <Skeleton className='h-3 w-24' />
                      <Skeleton className='h-3 w-2' />
                      <Skeleton className='h-3 w-32' />
                    </div>
                  </div>
                  <Skeleton className='h-8 w-8 shrink-0' />
                </div>
              ))}
            </div>
          </section>

          {/* Active Tasks */}
          <section className='rounded-xl py-4 -mx-3 px-3 space-y-4'>
            <div className='flex items-center justify-between border-b border-muted pb-3 mb-3 -mx-3 px-3 md:mx-0 md:px-0'>
              <h3 className='font-bold flex items-center gap-2'>
                <ListTodo className='w-4 h-4' />
                Active Tasks
              </h3>
            </div>
            <div className='space-y-0 divide-y'>
              {Array.from({ length: 3 }).map(i => (
                <div
                  key={i}
                  className='flex items-center justify-between px-3 py-3'
                >
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <Skeleton className='h-4 w-48' />
                    </div>
                    <div className='flex items-center gap-2'>
                      <Skeleton className='h-5 w-16 rounded-full' />
                      <Skeleton className='h-3 w-3' />
                      <Skeleton className='h-3 w-24' />
                      <Skeleton className='h-3 w-2' />
                      <Skeleton className='h-3 w-32' />
                    </div>
                  </div>
                  <Skeleton className='h-8 w-8 shrink-0' />
                </div>
              ))}
            </div>
          </section>

          {/* 1:1 Meetings */}
          <section className='rounded-xl py-4 -mx-3 px-3 space-y-4'>
            <div className='flex items-center justify-between border-b border-muted pb-3 mb-3 -mx-3 px-3 md:mx-0 md:px-0'>
              <h3 className='font-bold flex items-center gap-2'>
                <Handshake className='w-4 h-4' />
                1:1 Meetings
              </h3>
            </div>
            <div className='space-y-0 divide-y'>
              {Array.from({ length: 3 }).map(i => (
                <div
                  key={i}
                  className='flex items-center justify-between px-3 py-3'
                >
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <Skeleton className='h-4 w-32' />
                      <Skeleton className='h-4 w-2' />
                      <Skeleton className='h-4 w-24' />
                    </div>
                    <div className='flex items-center gap-2'>
                      <Skeleton className='h-3 w-24' />
                      <Skeleton className='h-3 w-2' />
                      <Skeleton className='h-3 w-32' />
                    </div>
                  </div>
                  <Skeleton className='h-8 w-8 shrink-0' />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <div className='w-full lg:w-80 space-y-6'>
          {/* Overview Section */}
          <section>
            <SectionHeader
              icon={Users}
              title='AI Overview'
              action={<Skeleton className='h-8 w-8' />}
            />
            <div className='space-y-3 mt-2'>
              <Skeleton className='h-32 w-full rounded-lg' />
            </div>
          </section>

          {/* Job Role Section */}
          <section>
            <SectionHeader
              icon={Briefcase}
              title='Job Role'
              action={<Skeleton className='h-8 w-8' />}
            />
            <div className='space-y-2 mt-2'>
              <Skeleton className='h-16 w-full rounded-lg' />
            </div>
          </section>

          {/* Direct Reports */}
          <section>
            <SectionHeader icon={Users} title='Direct Reports (0)' />
            <div className='space-y-3 mt-2'>
              {Array.from({ length: 2 }).map(i => (
                <div key={i} className='flex items-center gap-3'>
                  <Skeleton className='h-10 w-10 rounded-full' />
                  <div className='flex-1 space-y-1'>
                    <Skeleton className='h-4 w-32' />
                    <Skeleton className='h-3 w-24' />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
