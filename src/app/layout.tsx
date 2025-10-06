import './globals.css'
import ServerConditionalLayout from '@/components/server-conditional-layout'
import type { ReactNode } from 'react'
import '@/lib/reports/register-all'

export const metadata = {
  title: 'ManagerOS',
  description: 'Manager-only MVP',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-white.ico', media: '(prefers-color-scheme: dark)' },
      { url: '/favicon-black.ico', media: '(prefers-color-scheme: light)' },
    ],
    shortcut: [
      { url: '/favicon-white.ico', media: '(prefers-color-scheme: dark)' },
      { url: '/favicon-black.ico', media: '(prefers-color-scheme: light)' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ManagerOS',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'ManagerOS',
    'application-name': 'ManagerOS',
    'msapplication-TileColor': '#6366f1',
    'theme-color': '#6366f1',
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
