import { MarketingHeader } from '@/components/marketing/marketing-header'
import { AnimatedGeometricPattern } from '@/components/marketing/animated-geometric-pattern'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ThemeProvider } from 'next-themes'
import { ClerkProvider } from '@clerk/nextjs'
import { CrispIntegration } from '@/components/crisp-integration'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (userId) {
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
        <CrispIntegration />
      </ThemeProvider>
    </ClerkProvider>
  )
}
