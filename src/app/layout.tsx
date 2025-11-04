import './globals.css'
import type { ReactNode } from 'react'
import '@/lib/reports/register-all'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'ManagerOS',
    template: '%s | ManagerOS',
  },
  description: 'The ultimate productivity tool for managers',
  applicationName: 'ManagerOS',
  keywords: ['ManagerOS', 'Manager', 'MVP', 'Productivity', 'Business'],
  icons: {
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
        {children}
      </body>
    </html>
  )
}
