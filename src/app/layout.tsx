import './globals.css'
import ServerConditionalLayout from '@/components/server-conditional-layout'
import type { ReactNode } from 'react'
import '@/lib/reports/register-all'

export const metadata = {
  title: 'ManagerOS',
  description: 'Manager-only MVP',
  icons: {
    icon: [
      { url: '/favicon-white.ico', media: '(prefers-color-scheme: dark)' },
      { url: '/favicon-black.ico', media: '(prefers-color-scheme: light)' },
    ],
    shortcut: [
      { url: '/favicon-white.ico', media: '(prefers-color-scheme: dark)' },
      { url: '/favicon-black.ico', media: '(prefers-color-scheme: light)' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='min-h-screen bg-background text-foreground antialiased'>
        <ServerConditionalLayout>{children}</ServerConditionalLayout>
      </body>
    </html>
  )
}
