import Sidebar from './sidebar'
import { getFilteredNavigation } from '@/lib/auth-utils'
import { getCurrentUserWithPerson } from '@/lib/actions/organization'
import { Suspense } from 'react'
export default async function SidebarServer() {
  const userWithPerson = await getCurrentUserWithPerson()
  const filteredNavigation = await getFilteredNavigation(userWithPerson.user)

  return (
    <Suspense fallback={<Sidebar />}>
      <Sidebar
        navigation={filteredNavigation}
        serverSession={userWithPerson.user}
        personData={userWithPerson.person}
      />
    </Suspense>
  )
}
