import { ReactNode } from 'react'
import { BreadcrumbProvider } from '@/components/breadcrumb-provider'
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
import { TaskReminderProvider } from '@/components/task-reminders/task-reminder-provider'
import { AIChatSidebarWrapper } from '@/components/ai-chat-sidebar-wrapper'
import { CacheProvider } from '@/components/cache-provider'
import SidebarClient from '@/components/sidebar-client'
import { MainContentWrapper } from '@/components/main-content-wrapper'
import { ClerkProvider } from '@clerk/nextjs'
import { CrispIntegration } from '@/components/crisp-integration'
import {
  getCurrentUserWithPersonAndOrganization,
  getFilteredNavigation,
} from '../../lib/auth-utils'
import { getIncompleteTasksCountForAssignee } from '@/lib/data/tasks'
import { prisma } from '@/lib/db'

interface AppLayoutProps {
  children: ReactNode
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const { user, person, organization } =
    await getCurrentUserWithPersonAndOrganization()
  const filteredNavigation = await getFilteredNavigation(user)

  // Fetch badge counts for navigation items
  const navigationWithBadges = await Promise.all(
    filteredNavigation.map(async item => {
      // Add incomplete tasks count to "My Tasks"
      if (
        item.href === '/my-tasks' &&
        person?.id &&
        user.managerOSOrganizationId &&
        user.managerOSUserId
      ) {
        const tasksInfo = await getIncompleteTasksCountForAssignee(
          person.id,
          user.managerOSOrganizationId,
          user.managerOSUserId
        )
        return {
          ...item,
          badgeCount: tasksInfo.count,
          badgeVariant: (tasksInfo.hasOverdue ? 'error' : 'secondary') as
            | 'error'
            | 'secondary',
        }
      }

      // Add in progress initiatives count to "Initiatives"
      if (
        item.href === '/initiatives' &&
        person?.id &&
        user.managerOSOrganizationId
      ) {
        const inProgressInitiativesCount = await prisma.initiative.count({
          where: {
            organizationId: user.managerOSOrganizationId,
            owners: {
              some: { personId: person.id },
            },
            status: 'in_progress',
          },
        })
        return { ...item, badgeCount: inProgressInitiativesCount }
      }

      return item
    })
  )

  // Render full layout for authenticated routes
  return (
    <ClerkProvider
      taskUrls={{
        'choose-organization': '/dashboard',
      }}
    >
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
                    <OfflineAwareLayout>
                      <div className='flex min-h-screen'>
                        <SidebarClient
                          user={user}
                          person={person}
                          organization={organization}
                          navigation={navigationWithBadges}
                        />
                        <MainContentWrapper>
                          <TopBar />
                          <main className='flex-1 overflow-auto p-3 md:p-6'>
                            <div className='w-full'>{children}</div>
                          </main>
                        </MainContentWrapper>
                        <AIChatSidebarWrapper />
                      </div>
                    </OfflineAwareLayout>
                    <CommandPalette
                      user={user}
                      person={person}
                      organization={organization}
                    />
                    <CreateTaskModal />
                    <PersonSelectorModal />
                    <EditFormNavigator />
                    <TaskReminderProvider />
                  </CacheProvider>
                </MobileMenuProvider>
              </BreadcrumbProvider>
            </CommandPaletteProvider>
          </AIChatProvider>
          <Toaster theme='system' />
        </TooltipProvider>
        <CrispIntegration hideButton={true} />
      </ThemeProvider>
    </ClerkProvider>
  )
}
