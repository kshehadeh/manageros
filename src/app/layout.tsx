import './globals.css'
import AuthSessionProvider from '@/components/session-provider'
import Navigation from '@/components/navigation'
import type { ReactNode } from 'react'

export const metadata = { title: 'ManagerOS', description: 'Manager-only MVP' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en'>
      <body>
        <AuthSessionProvider>
          <div className='mx-auto max-w-6xl p-6'>
            <Navigation />
            {children}
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
