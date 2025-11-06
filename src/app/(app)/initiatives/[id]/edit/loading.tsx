import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeader } from '@/components/ui/section-header'
import { Rocket, Target, Users, Settings } from 'lucide-react'

export default function LoadingPage() {
  return (
    <div className='px-4 lg:px-0'>
      <div className='space-y-6'>
        {/* Form Header */}
        <div className='flex items-start justify-between gap-4 pb-2 border-b border-border/50'>
          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-2'>
              <Rocket className='h-6 w-6 text-muted-foreground' />
              <h1 className='text-2xl font-semibold'>Edit Initiative</h1>
            </div>
          </div>
        </div>

        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Main Form Content */}
          <div className='flex-1 space-y-6'>
            {/* Basic Information Section */}
            <div className='space-y-4'>
              <SectionHeader icon={Rocket} title='Basic Information' />
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-10 w-full' />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-10 w-full' />
                  </div>
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-10 w-full' />
                  </div>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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

            {/* Summary Section */}
            <div className='space-y-4'>
              <SectionHeader icon={Rocket} title='Summary' />
              <div className='space-y-4'>
                <Skeleton className='h-32 w-full rounded-md' />
              </div>
            </div>

            {/* Objectives Section */}
            <div className='space-y-4'>
              <SectionHeader icon={Target} title='Objectives' />
              <div className='space-y-4'>
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className='space-y-2 border rounded-lg p-4'>
                    <div className='space-y-2'>
                      <Skeleton className='h-4 w-20' />
                      <Skeleton className='h-10 w-full' />
                    </div>
                    <div className='space-y-2'>
                      <Skeleton className='h-4 w-24' />
                      <Skeleton className='h-20 w-full rounded-md' />
                    </div>
                    <Skeleton className='h-9 w-24' />
                  </div>
                ))}
                <Skeleton className='h-10 w-40' />
              </div>
            </div>

            {/* Owners Section */}
            <div className='space-y-4'>
              <SectionHeader icon={Users} title='Owners' />
              <div className='space-y-4'>
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className='flex items-center gap-2'>
                    <Skeleton className='h-10 flex-1' />
                    <Skeleton className='h-10 w-32' />
                    <Skeleton className='h-10 w-10' />
                  </div>
                ))}
                <Skeleton className='h-10 w-32' />
              </div>
            </div>

            {/* Settings Section */}
            <div className='space-y-4'>
              <SectionHeader icon={Settings} title='Settings' />
              <div className='space-y-4'>
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
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-10 w-full' />
                </div>
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
    </div>
  )
}
