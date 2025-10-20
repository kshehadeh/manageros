'use client'

import { useMemo } from 'react'
import { TASK_STATUS } from '../../lib/task-status'
import { ExpandableSection } from '../expandable-section'
import { TaskDataTable } from '../tasks/data-table'

interface DashboardAssignedTasksSectionProps {
  personId: string
}

export function DashboardAssignedTasksSection({
  personId,
}: DashboardAssignedTasksSectionProps) {
  // Memoize immutableFilters to prevent infinite loop
  const immutableFilters = useMemo(
    () => ({
      assigneeId: personId,
      status: [TASK_STATUS.TODO, TASK_STATUS.DOING, TASK_STATUS.BLOCKED].join(
        ','
      ),
    }),
    [personId]
  )

  return (
    <ExpandableSection
      title='Assigned Tasks'
      viewAllHref='/my-tasks'
      icon='ListTodo'
    >
      <TaskDataTable
        settingsId='dashboard-assigned-tasks'
        hideFilters={true}
        immutableFilters={immutableFilters}
        visibleColumns={['title', 'dueDate']}
      />
    </ExpandableSection>
  )
}
