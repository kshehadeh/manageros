import { HelpHeader } from '@/components/help/help-header'
import { ThemeProvider } from 'next-themes'
import { ClerkProvider } from '@clerk/nextjs'

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Note: This layout does NOT redirect authenticated users
  // Help pages should be accessible to everyone
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
          <div className='relative z-10'>
            <HelpHeader />
            {children}
          </div>
        </main>
      </ThemeProvider>
    </ClerkProvider>
  )
}
