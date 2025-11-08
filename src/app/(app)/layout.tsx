import { ReactNode } from 'react'
import { BreadcrumbProvider } from '@/components/breadcrumb-provider'
import { DefaultBreadcrumbHandler } from '@/components/default-breadcrumb-handler'
import { MobileMenuProvider } from '@/components/mobile-menu-provider'
import { AIChatProvider } from '@/components/ai-chat-provider'
import TopBar from '@/components/top-bar'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CommandPaletteProvider } from '@/components/command-palette/provider'
import { CommandPalette } from '@/components/command-palette/command-palette'
import { CreateTaskModal } from '@/components/command-palette/create-task-modal'
import { PersonSelectorModal } from '@/components/command-palette/person-selector-modal'
import { EditFormNavigator } from '@/components/edit-form-navigator'
import { OfflineAwareLayout } from '@/components/offline-aware-layout'
import { AIChatSidebarWrapper } from '@/components/ai-chat-sidebar-wrapper'
import { CacheProvider } from '@/components/cache-provider'
import SidebarClient from '@/components/sidebar-client'
import { ClerkProvider } from '@clerk/nextjs'
import { shadcn } from '@clerk/themes'

interface AppLayoutProps {
  children: ReactNode
}

export default async function AppLayout({ children }: AppLayoutProps) {
  // Render full layout for authenticated routes
  return (
    <ClerkProvider appearance={{ theme: shadcn }}>
      <ThemeProvider
        attribute='class'
        defaultTheme='dark'
        enableSystem={true}
        storageKey='manageros-theme'
        disableTransitionOnChange
      >
        <TooltipProvider>
          <AIChatProvider>
            <CommandPaletteProvider>
              <BreadcrumbProvider>
                <MobileMenuProvider>
                  <CacheProvider>
                    <DefaultBreadcrumbHandler />
                    <OfflineAwareLayout>
                      <div className='flex min-h-screen'>
                        <SidebarClient />
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
                    <EditFormNavigator />
                  </CacheProvider>
                </MobileMenuProvider>
              </BreadcrumbProvider>
            </CommandPaletteProvider>
          </AIChatProvider>
          <Toaster theme='system' />
        </TooltipProvider>
      </ThemeProvider>
    </ClerkProvider>
  )
}
