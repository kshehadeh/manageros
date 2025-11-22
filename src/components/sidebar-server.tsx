import Sidebar from './sidebar'
import { getFilteredNavigation } from '@/lib/auth-utils'
import { getCurrentUserWithPersonAndOrganization } from '@/lib/auth-utils'

export default async function SidebarServer() {
  const userWithPerson = await getCurrentUserWithPersonAndOrganization()
  const filteredNavigation = await getFilteredNavigation(userWithPerson.user)

  return (
    <Sidebar
      navigation={filteredNavigation}
      serverSession={userWithPerson.user}
      personData={userWithPerson.person}
    />
  )
}
