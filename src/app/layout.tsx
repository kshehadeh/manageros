/* eslint-disable camelcase */
import './globals.css'
import type { ReactNode } from 'react'
import '@/lib/reports/register-all'
import { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'mpath',
    template: '%s | mpath',
  },
  description: 'The ultimate productivity tool for managers',
  applicationName: 'mpath',
  keywords: ['mpath', 'Manager', 'MVP', 'Productivity', 'Business'],
  icons: {
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'mpath',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'mpath',
    'application-name': 'mpath',
    'msapplication-TileColor': '#6366f1',
    'theme-color': '#6366f1',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable}`}
    >
      <body className='min-h-screen bg-background text-foreground antialiased'>
        {children}
      </body>
    </html>
  )
}
