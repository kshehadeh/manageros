import { MarketingHeader } from '@/components/marketing/marketing-header'
import { AnimatedGeometricPattern } from '@/components/marketing/animated-geometric-pattern'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ThemeProvider } from 'next-themes'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    return redirect('/dashboard')
  }

  return (
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
  )
}
