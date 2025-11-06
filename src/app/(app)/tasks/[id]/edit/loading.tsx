import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { ListTodo, User, CheckCircle, Calendar, Target } from 'lucide-react'

export default function LoadingPage() {
  return (
    <div className='page-container'>
      <PageSection>
        <div className='space-y-6'>
          {/* Form Header */}
          <div className='flex items-start justify-between gap-4 pb-2 border-b border-border/50'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <ListTodo className='h-6 w-6 text-muted-foreground' />
                <h1 className='text-2xl font-semibold'>Edit Task</h1>
              </div>
              <Skeleton className='h-4 w-64' />
            </div>
          </div>

          <div className='flex flex-col lg:flex-row gap-6'>
            {/* Main Form Content */}
            <div className='flex-1 space-y-6'>
              {/* Summary Section */}
              <div className='space-y-4'>
                <SectionHeader icon={ListTodo} title='Summary' />
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-20' />
                    <Skeleton className='h-10 w-full' />
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className='space-y-4'>
                <SectionHeader icon={ListTodo} title='Description' />
                <div className='space-y-4'>
                  <Skeleton className='h-32 w-full rounded-md' />
                </div>
              </div>

              {/* Assignment Section */}
              <div className='space-y-4'>
                <SectionHeader icon={User} title='Assignment' />
                <div className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Skeleton className='h-4 w-20' />
                      <Skeleton className='h-10 w-full' />
                    </div>
                    <div className='space-y-2'>
                      <Skeleton className='h-4 w-24' />
                      <Skeleton className='h-10 w-full' />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Priority Section */}
              <div className='space-y-4'>
                <SectionHeader icon={CheckCircle} title='Status & Priority' />
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
                </div>
              </div>

              {/* Due Date Section */}
              <div className='space-y-4'>
                <SectionHeader icon={Calendar} title='Due Date' />
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-20' />
                    <Skeleton className='h-10 w-full' />
                  </div>
                </div>
              </div>

              {/* Related Items Section */}
              <div className='space-y-4'>
                <SectionHeader icon={Target} title='Related Items' />
                <div className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Skeleton className='h-4 w-24' />
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
              <div className='flex justify-end gap-2 pt-4'>
                <Skeleton className='h-10 w-24' />
                <Skeleton className='h-10 w-32' />
              </div>
            </div>
          </div>
        </div>
      </PageSection>
    </div>
  )
}
