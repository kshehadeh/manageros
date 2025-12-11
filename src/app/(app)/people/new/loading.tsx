import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeader } from '@/components/ui/section-header'
import { User, Users, Calendar } from 'lucide-react'

export default function LoadingPage() {
  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>New Person</h2>
      </div>

      {/* Form Content */}
      <div className='space-y-2xl'>
        {/* Basic Information Section */}
        <div className='space-y-xl'>
          <SectionHeader icon={User} title='Basic Information' />
          <div className='space-y-xl'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-10 w-full' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-10 w-full' />
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-10 w-full' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-10 w-full' />
              </div>
            </div>
          </div>
        </div>

        {/* Team & Reporting Section */}
        <div className='space-y-xl'>
          <SectionHeader icon={Users} title='Team & Reporting' />
          <div className='space-y-xl'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-10 w-full' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-10 w-full' />
              </div>
            </div>
          </div>
        </div>

        {/* Status & Dates Section */}
        <div className='space-y-xl'>
          <SectionHeader icon={Calendar} title='Status & Dates' />
          <div className='space-y-xl'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-10 w-full' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-10 w-full' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-10 w-full' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-10 w-full' />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className='flex justify-end gap-md'>
          <Skeleton className='h-10 w-32' />
        </div>
      </div>
    </div>
  )
}
