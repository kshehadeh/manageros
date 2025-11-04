import Sidebar from './sidebar'
import type { User as NextAuthUser } from 'next-auth'
import { getFilteredNavigation, getOptionalUser } from '@/lib/auth-utils'
import { getCurrentUserWithPerson } from '@/lib/actions/organization'
import { prisma } from '@/lib/db'

export default async function SidebarServer() {
  // Get filtered navigation and server session for authenticated routes
  // Use optional auth to enable static rendering
  const user = await getOptionalUser()

  if (!user) {
    // Render sidebar without user data when not authenticated
    // The middleware will handle redirects
    return <Sidebar navigation={[]} serverSession={null} personData={null} />
  }

  // User is authenticated, fetch full data
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
    // Fallback if there's an error fetching user data
    return <Sidebar navigation={[]} serverSession={null} personData={null} />
  }

  return (
    <Sidebar
      navigation={filteredNavigation}
      serverSession={serverSession}
      personData={personData}
    />
  )
}
