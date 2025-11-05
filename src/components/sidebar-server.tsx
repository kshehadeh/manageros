import Sidebar from './sidebar'
import { getFilteredNavigation } from '@/lib/auth-utils'
import { getCurrentUserWithPerson } from '@/lib/actions/organization'
export default async function SidebarServer() {
  const userWithPerson = await getCurrentUserWithPerson()
  const filteredNavigation = await getFilteredNavigation()

  return (
    <Sidebar
      navigation={filteredNavigation}
      serverSession={userWithPerson.user}
      personData={userWithPerson.person}
    />
  )
}
