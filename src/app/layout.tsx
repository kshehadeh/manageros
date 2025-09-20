import './globals.css'
import AuthSessionProvider from '@/components/session-provider'
import { BreadcrumbProvider } from '@/components/breadcrumb-provider'
import { DefaultBreadcrumbHandler } from '@/components/default-breadcrumb-handler'
import Sidebar from '@/components/sidebar'
import TopBar from '@/components/top-bar'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import type { ReactNode } from 'react'

export const metadata = { title: 'ManagerOS', description: 'Manager-only MVP' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning className='dark'>
      <body className='min-h-screen bg-background text-foreground antialiased'>
        <ThemeProvider attribute='class' defaultTheme='dark' enableSystem={false} disableTransitionOnChange>
          <AuthSessionProvider>
            <BreadcrumbProvider>
              <DefaultBreadcrumbHandler />
              <div className='flex min-h-screen'>
                <Sidebar />
                <div className='flex-1 flex flex-col overflow-hidden lg:ml-0'>
                  <TopBar />
                  <main className='flex-1 overflow-auto p-6 pt-20 lg:pt-6'>
                    {children}
                  </main>
                </div>
              </div>
            </BreadcrumbProvider>
          </AuthSessionProvider>
          <Toaster theme='system' />
        </ThemeProvider>
      </body>
    </html>
  )
}
