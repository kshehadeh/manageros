'use client'

import type { TaskListItem } from '@/lib/task-list-select'
import type { Person, Initiative } from '@prisma/client'
import { GroupedTasksShared } from './grouped-tasks-shared'

interface GroupedTasksPageClientProps {
  people: Person[]
  initiatives: Initiative[]
  initialTasks?: TaskListItem[]
}

export function GroupedTasksPageClient({
  people,
  initiatives,
}: GroupedTasksPageClientProps) {
  return (
    <GroupedTasksShared
      people={people}
      initiatives={initiatives}
      showOnlyMyTasks={false}
      settingsId='all-tasks'
    />
  )
}
