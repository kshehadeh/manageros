import { MarketingHeader } from '@/components/marketing/marketing-header'
import { AnimatedGeometricPattern } from '@/components/marketing/animated-geometric-pattern'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ThemeProvider } from 'next-themes'
import { ClerkProvider } from '@clerk/nextjs'
import { headers } from 'next/headers'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  // Allow authenticated users to access landing pages
  const isLandingPage = pathname.startsWith('/landing/')

  if (userId && !isLandingPage) {
    return redirect('/dashboard')
  }

  return (
    <ClerkProvider>
      <ThemeProvider
        attribute='class'
        defaultTheme='dark'
        enableSystem={true}
        storageKey='manageros-theme'
        disableTransitionOnChange
      >
        <main className='relative min-h-screen overflow-hidden bg-[#05070f] text-white'>
          <div className='pointer-events-none absolute inset-0 overflow-hidden'>
            <AnimatedGeometricPattern />
          </div>
          <div className='relative z-10'>
            <MarketingHeader />
            {children}
          </div>
        </main>
      </ThemeProvider>
    </ClerkProvider>
  )
}
