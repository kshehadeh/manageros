'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronUp } from 'lucide-react'
import Image from 'next/image'
import { Link } from '@/components/ui/link'

interface TargetPerson {
  id: string
  name: string
  email: string | null
  role: string | null
  jobRole: {
    title: string
  } | null
  stats?: {
    initiativesCount: number
    jiraTicketsCount: number
    openPrsCount: number
  }
}

interface FeedbackFormLayoutProps {
  targetPerson: TargetPerson
  children: React.ReactNode
}

export function FeedbackFormLayout({
  targetPerson,
  children,
}: FeedbackFormLayoutProps) {
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false)

  return (
    <>
      {/* Mobile: Bottom Sheet Panel */}
      {/* Bottom Sheet Trigger - Always visible at bottom */}
      <button
        type='button'
        onClick={() => setIsMobilePanelOpen(true)}
        className='lg:hidden fixed bottom-0 left-0 right-0 z-30 w-full p-xl bg-background border-t border-border shadow-lg flex items-center justify-center gap-md text-sm font-medium text-foreground hover:bg-muted transition-colors'
      >
        <ChevronUp className='h-4 w-4' />
        <span>View information about {targetPerson.name}</span>
      </button>

      {/* Bottom Sheet Overlay */}
      {isMobilePanelOpen && (
        <div
          className='lg:hidden fixed inset-0 bg-black/50 z-40'
          onClick={() => setIsMobilePanelOpen(false)}
        />
      )}

      {/* Bottom Sheet Content */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border rounded-t-lg z-50 transition-transform duration-300 ease-out ${
          isMobilePanelOpen
            ? 'translate-y-0'
            : 'translate-y-full pointer-events-none'
        }`}
        style={{
          maxHeight: '80vh',
          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className='p-2xl overflow-y-auto' style={{ maxHeight: '80vh' }}>
          <div className='flex items-center justify-between mb-xl'>
            <h3 className='text-lg font-semibold'>About the Feedback Target</h3>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => setIsMobilePanelOpen(false)}
              className='h-8 w-8 p-0'
            >
              <ChevronUp className='h-4 w-4 rotate-180' />
            </Button>
          </div>
          <PersonInfoContent targetPerson={targetPerson} />
        </div>
      </div>

      {/* Desktop and Mobile Layout */}
      <div className='flex flex-col lg:flex-row min-h-screen'>
        {/* Desktop: Left Sidebar - Logo, Title, Person Info */}
        <div className='hidden lg:flex lg:w-1/3 lg:flex-shrink-0 lg:flex-col lg:border-r lg:border-border bg-muted/30'>
          <div className='flex flex-col h-full p-2xl'>
            {/* Logo */}
            <Link href='/' className='flex items-center gap-lg mb-3xl'>
              <Image
                src='/images/indigo-logo-white.png'
                alt='mpath Logo'
                width={40}
                height={40}
                className='h-10 w-10'
                priority
              />
              <div>
                <p className='text-lg font-semibold tracking-tight text-foreground'>
                  mpath
                </p>
                <p className='text-xs text-muted-foreground hidden sm:block'>
                  Built for engineering leaders
                </p>
              </div>
            </Link>

            {/* Person Info */}
            <PersonInfoContent targetPerson={targetPerson} />
          </div>
        </div>

        {/* Right Side: Form Content */}
        <div className='flex-1 min-w-0 pb-3xl lg:pb-0 lg:overflow-y-auto'>
          <div className='mx-auto p-2xl lg:p-3xl'>{children}</div>
        </div>
      </div>
    </>
  )
}

function PersonInfoContent({ targetPerson }: { targetPerson: TargetPerson }) {
  return (
    <div className='space-y-2xl'>
      <div>
        <h2 className='text-sm font-medium text-muted-foreground mb-md'>
          Feedback for
        </h2>
        <h1 className='text-3xl font-bold text-foreground mb-xl'>
          {targetPerson.name}
        </h1>
      </div>

      {targetPerson.jobRole?.title && (
        <div>
          <p className='text-sm font-semibold text-foreground mb-xs'>Role</p>
          <p className='text-base text-muted-foreground'>
            {targetPerson.jobRole.title}
          </p>
        </div>
      )}

      {targetPerson.stats && (
        <div>
          <p className='text-sm font-semibold text-foreground mb-xs'>Context</p>
          <p className='text-base text-muted-foreground'>
            {targetPerson.name} is involved in{' '}
            <span className='font-semibold text-foreground'>
              {targetPerson.stats.initiativesCount}
            </span>{' '}
            initiatives, has been working on{' '}
            <span className='font-semibold text-foreground'>
              {targetPerson.stats.jiraTicketsCount}
            </span>{' '}
            Jira tickets and has{' '}
            <span className='font-semibold text-foreground'>
              {targetPerson.stats.openPrsCount}
            </span>{' '}
            open PR.
          </p>
        </div>
      )}
    </div>
  )
}
