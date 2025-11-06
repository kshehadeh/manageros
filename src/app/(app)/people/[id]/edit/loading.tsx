import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeader } from '@/components/ui/section-header'
import { User, Users, Calendar } from 'lucide-react'
import { FaJira, FaGithub } from 'react-icons/fa'

export default function LoadingPage() {
  return (
    <div className='space-y-6'>
      {/* Person Edit Header */}
      <div className='page-header'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-2'>
              <Skeleton className='h-16 w-16 rounded-full' />
              <div className='flex items-center gap-3'>
                <Skeleton className='h-8 w-48' />
              </div>
            </div>
            <Skeleton className='h-5 w-32 mb-2' />
            <Skeleton className='h-4 w-40' />
          </div>
          <Skeleton className='h-9 w-9 rounded-md' />
        </div>
      </div>

      <div className='space-y-6'>
        {/* Form Header */}
        <div className='flex items-start justify-between gap-4 pb-2 border-b border-border/50'>
          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-2'>
              <User className='h-6 w-6 text-muted-foreground' />
              <h1 className='text-2xl font-semibold'>Edit Person</h1>
            </div>
          </div>
        </div>

        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Main Form Content */}
          <div className='flex-1 space-y-6'>
            {/* Basic Information Section */}
            <div className='space-y-4'>
              <SectionHeader icon={User} title='Basic Information' />
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

            {/* Organization Section */}
            <div className='space-y-4'>
              <SectionHeader icon={Users} title='Organization' />
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

            {/* Dates Section */}
            <div className='space-y-4'>
              <SectionHeader icon={Calendar} title='Dates' />
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

            {/* Account Linking Section */}
            <div className='space-y-4'>
              <SectionHeader icon={User} title='Account Linking' />
              <div className='space-y-4'>
                <div className='space-y-3 border rounded-lg p-4'>
                  <div className='flex items-center gap-2 pb-2 border-b'>
                    <Skeleton className='h-4 w-4' />
                    <Skeleton className='h-4 w-24' />
                  </div>
                  <div className='space-y-2'>
                    <Skeleton className='h-10 w-full' />
                    <Skeleton className='h-8 w-24' />
                  </div>
                </div>
                <div className='space-y-3 border rounded-lg p-4'>
                  <div className='flex items-center gap-2 pb-2 border-b'>
                    <FaJira className='h-4 w-4 text-muted-foreground' />
                    <Skeleton className='h-4 w-20' />
                  </div>
                  <div className='space-y-2'>
                    <Skeleton className='h-10 w-full' />
                    <Skeleton className='h-8 w-24' />
                  </div>
                </div>
                <div className='space-y-3 border rounded-lg p-4'>
                  <div className='flex items-center gap-2 pb-2 border-b'>
                    <FaGithub className='h-4 w-4 text-muted-foreground' />
                    <Skeleton className='h-4 w-24' />
                  </div>
                  <div className='space-y-2'>
                    <Skeleton className='h-10 w-full' />
                    <Skeleton className='h-8 w-24' />
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
    </div>
  )
}
