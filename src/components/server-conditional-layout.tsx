import { headers } from 'next/headers'
import { ReactNode } from 'react'
import NetworkAwareSessionProvider from '@/components/network-aware-session-provider'
import { BreadcrumbProvider } from '@/components/breadcrumb-provider'
import { DefaultBreadcrumbHandler } from '@/components/default-breadcrumb-handler'
import { MobileMenuProvider } from '@/components/mobile-menu-provider'
import { AIChatProvider } from '@/components/ai-chat-provider'
import Sidebar from '@/components/sidebar'
import TopBar from '@/components/top-bar'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { CommandPaletteProvider } from '@/components/command-palette/provider'
import { CommandPalette } from '@/components/command-palette/command-palette'
import { CreateTaskModal } from '@/components/command-palette/create-task-modal'
import { PersonSelectorModal } from '@/components/command-palette/person-selector-modal'
import { OfflineAwareLayout } from '@/components/offline-aware-layout'
import { AIChatSidebarWrapper } from '@/components/ai-chat-sidebar-wrapper'
import { CacheProvider } from '@/components/cache-provider'
import { getFilteredNavigation, getCurrentUser } from '@/lib/auth-utils'
import type { User as NextAuthUser } from 'next-auth'

interface ServerConditionalLayoutProps {
  children: ReactNode
}

export default async function ServerConditionalLayout({
  children,
}: ServerConditionalLayoutProps) {
  const headersList = await headers()

  // Check the custom header set by middleware
  const isPublicHeader = headersList.get('x-is-public')
  const isPublic = isPublicHeader === 'true'

  if (isPublic) {
    // Render minimal layout for public routes
    return (
      <NetworkAwareSessionProvider>
        <ThemeProvider
          attribute='class'
          defaultTheme='dark'
          enableSystem={true}
          storageKey='manageros-theme'
          disableTransitionOnChange
        >
          <OfflineAwareLayout>{children}</OfflineAwareLayout>
          <Toaster theme='system' />
        </ThemeProvider>
      </NetworkAwareSessionProvider>
    )
  }

  // Get filtered navigation and server session for authenticated routes
  let filteredNavigation: Array<{
    name: string
    href: string
    icon: string
    adminOnly?: boolean
  }> = []
  let serverSession: NextAuthUser | null = null
  try {
    filteredNavigation = await getFilteredNavigation()
    serverSession = await getCurrentUser()
  } catch {
    // If user is not authenticated, getFilteredNavigation will throw
    // This should not happen due to middleware, but handle gracefully
    filteredNavigation = []
    serverSession = null
  }

  // Render full layout for authenticated routes
  return (
    <NetworkAwareSessionProvider>
      <ThemeProvider
        attribute='class'
        defaultTheme='dark'
        enableSystem={true}
        storageKey='manageros-theme'
        disableTransitionOnChange
      >
        <AIChatProvider>
          <CommandPaletteProvider>
            <BreadcrumbProvider>
              <MobileMenuProvider>
                <CacheProvider>
                  <DefaultBreadcrumbHandler />
                  <OfflineAwareLayout>
                    <div className='flex min-h-screen'>
                      <Sidebar
                        navigation={filteredNavigation}
                        serverSession={serverSession}
                      />
                      <div className='flex-1 flex flex-col overflow-hidden lg:ml-0'>
                        <TopBar />
                        <main className='flex-1 overflow-auto p-3 md:p-6'>
                          <div className='w-full'>{children}</div>
                        </main>
                      </div>
                      <AIChatSidebarWrapper />
                    </div>
                  </OfflineAwareLayout>
                  <CommandPalette />
                  <CreateTaskModal />
                  <PersonSelectorModal />
                </CacheProvider>
              </MobileMenuProvider>
            </BreadcrumbProvider>
          </CommandPaletteProvider>
        </AIChatProvider>
        <Toaster theme='system' />
      </ThemeProvider>
    </NetworkAwareSessionProvider>
  )
}
