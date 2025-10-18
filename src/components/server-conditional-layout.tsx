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
import { TooltipProvider } from '@/components/ui/tooltip'
import { CommandPaletteProvider } from '@/components/command-palette/provider'
import { CommandPalette } from '@/components/command-palette/command-palette'
import { CreateTaskModal } from '@/components/command-palette/create-task-modal'
import { PersonSelectorModal } from '@/components/command-palette/person-selector-modal'
import { EditFormNavigator } from '@/components/edit-form-navigator'
import { OfflineAwareLayout } from '@/components/offline-aware-layout'
import { AIChatSidebarWrapper } from '@/components/ai-chat-sidebar-wrapper'
import { CacheProvider } from '@/components/cache-provider'
import { getFilteredNavigation } from '@/lib/auth-utils'
import type { User as NextAuthUser } from 'next-auth'
import { getCurrentUserWithPerson } from '@/lib/actions/organization'
import { prisma } from '@/lib/db'

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
          <TooltipProvider>
            <OfflineAwareLayout>{children}</OfflineAwareLayout>
            <Toaster theme='system' />
          </TooltipProvider>
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
  let personData: {
    id: string
    name: string
    avatar: string | null
    email: string | null
    role: string | null
    jobRoleId: string | null
    jobRoleTitle: string | null
  } | null = null
  try {
    filteredNavigation = await getFilteredNavigation()
    const userWithPerson = await getCurrentUserWithPerson()
    serverSession = userWithPerson.user as NextAuthUser
    if (userWithPerson.person) {
      let jobRoleTitle: string | null = null
      if (userWithPerson.person.jobRoleId) {
        const jobRole = await prisma.jobRole.findUnique({
          where: { id: userWithPerson.person.jobRoleId },
          select: { title: true },
        })
        jobRoleTitle = jobRole?.title || null
      }

      personData = {
        id: userWithPerson.person.id,
        name: userWithPerson.person.name,
        avatar: userWithPerson.person.avatar,
        email: userWithPerson.person.email,
        role: userWithPerson.person.role,
        jobRoleId: userWithPerson.person.jobRoleId,
        jobRoleTitle,
      }
    }
  } catch {
    // If user is not authenticated, getFilteredNavigation will throw
    // This should not happen due to middleware, but handle gracefully
    filteredNavigation = []
    serverSession = null
    personData = null
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
        <TooltipProvider>
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
                          personData={personData}
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
                    <EditFormNavigator />
                  </CacheProvider>
                </MobileMenuProvider>
              </BreadcrumbProvider>
            </CommandPaletteProvider>
          </AIChatProvider>
          <Toaster theme='system' />
        </TooltipProvider>
      </ThemeProvider>
    </NetworkAwareSessionProvider>
  )
}
