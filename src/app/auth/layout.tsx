import type { ReactNode } from 'react'
import { IndigoIcon } from '@/components/indigo-icon'
import { ThemeProvider } from 'next-themes'
import Link from 'next/link'
import { ClerkProvider } from '@clerk/nextjs'
import { clerkAppearance } from '@/lib/clerk-appearance'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <ThemeProvider
        attribute='class'
        defaultTheme='dark'
        enableSystem={true}
        storageKey='manageros-theme'
        disableTransitionOnChange
      >
        <div className='bg-background text-foreground flex flex-col items-center justify-center p-4 min-h-screen'>
          <div className='mb-8'>
            <Link href='/' className='flex items-center gap-3'>
              <IndigoIcon width={60} height={50} color='currentColor' />
            </Link>
          </div>
          {children}
        </div>
      </ThemeProvider>
    </ClerkProvider>
  )
}
