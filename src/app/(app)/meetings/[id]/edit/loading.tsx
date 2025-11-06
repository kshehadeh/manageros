import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeader } from '@/components/ui/section-header'
import { Calendar, FileText, MapPin, Users, CalendarDays } from 'lucide-react'

export default function LoadingPage() {
  return (
    <div className='space-y-6'>
      {/* Form Header */}
      <div className='flex items-start justify-between gap-4 pb-2 border-b border-border/50'>
        <div className='flex-1'>
          <div className='flex items-center gap-3 mb-2'>
            <Calendar className='h-6 w-6 text-muted-foreground' />
            <h1 className='text-2xl font-semibold'>Edit Meeting</h1>
          </div>
          <Skeleton className='h-4 w-64' />
        </div>
      </div>

      <div className='flex flex-col lg:flex-row gap-6'>
        {/* Main Form Content */}
        <div className='flex-1 space-y-6'>
          {/* Basic Information Section */}
          <div className='space-y-4'>
            <SectionHeader icon={Calendar} title='Basic Information' />
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-10 w-full' />
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-10 w-full' />
                </div>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-10 w-full' />
                </div>
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-10 w-full' />
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className='space-y-4'>
            <SectionHeader icon={FileText} title='Description' />
            <div className='space-y-4'>
              <Skeleton className='h-32 w-full rounded-md' />
            </div>
          </div>

          {/* Location Section */}
          <div className='space-y-4'>
            <SectionHeader icon={MapPin} title='Location' />
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-10 w-full' />
              </div>
            </div>
          </div>

          {/* Participants Section */}
          <div className='space-y-4'>
            <SectionHeader icon={Users} title='Participants' />
            <div className='space-y-4'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='flex items-center gap-2'>
                  <Skeleton className='h-10 flex-1' />
                  <Skeleton className='h-10 w-32' />
                  <Skeleton className='h-10 w-10' />
                </div>
              ))}
              <Skeleton className='h-10 w-40' />
            </div>
          </div>

          {/* Recurrence Section */}
          <div className='space-y-4'>
            <SectionHeader icon={CalendarDays} title='Recurrence' />
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-5 w-5 rounded' />
                <Skeleton className='h-4 w-32' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-28' />
                <Skeleton className='h-10 w-full' />
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className='space-y-4'>
            <SectionHeader icon={FileText} title='Notes' />
            <div className='space-y-4'>
              <Skeleton className='h-32 w-full rounded-md' />
            </div>
          </div>

          {/* Submit Button */}
          <div className='flex justify-end gap-2 pt-4'>
            <Skeleton className='h-10 w-24' />
            <Skeleton className='h-10 w-32' />
          </div>
        </div>
      </div>
    </div>
  )
}
