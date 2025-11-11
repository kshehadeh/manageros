'use client'

import { Link } from '@/components/ui/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/ui/page-container'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()

  return (
    <PageContainer>
      <div className='flex min-h-[calc(100vh-8rem)] flex-col lg:flex-row items-start justify-center gap-8 lg:gap-12 px-4 '>
        {/* Left side - Coffee break GIF */}
        <div className='shrink-0 w-full lg:w-auto md:block hidden'>
          <Image
            src='/images/coffeebreak.gif'
            alt='Man enjoying coffee break'
            width={400}
            height={400}
            className='rounded-lg border-2 border-primary/20 shadow-lg w-full max-w-md lg:max-w-none'
            unoptimized
            priority
          />
        </div>

        {/* Right side - All text content */}
        <div className='flex flex-col items-top lg:items-start text-center lg:text-left gap-8 flex-1'>
          {/* Animated 404 with quirky styling */}
          <div className='relative w-full'>
            <h1 className='text-7xl lg:text-9xl font-bold text-primary/20 dark:text-primary/10'>
              Four Oh Four
            </h1>
          </div>

          {/* Quirky message */}
          <div className='space-y-4'>
            <h2 className='text-2xl lg:text-3xl font-bold text-foreground'>
              Oops! Maybe it's time for a coffee break.
            </h2>
            <p className='text-base lg:text-lg text-muted-foreground'>
              There are a lot of reasons this page could be missing including it
              never existed - but more likely, you don't have access to it.
            </p>
          </div>

          {/* Action buttons */}
          <div className='flex flex-wrap items-center justify-center lg:justify-start gap-4 w-full'>
            <Button asChild variant='default' size='lg'>
              <Link href='/dashboard' className='flex items-center gap-2'>
                <Home className='size-4' />
                Go to Dashboard
              </Link>
            </Button>
            <Button
              variant='outline'
              size='lg'
              onClick={() => router.back()}
              className='flex items-center gap-2'
            >
              <ArrowLeft className='size-4' />
              Go Back to Last Page
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
