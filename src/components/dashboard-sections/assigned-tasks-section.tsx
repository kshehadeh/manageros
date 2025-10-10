'use client'

import { TASK_STATUS } from '../../lib/task-status'
import { ExpandableSection } from '../expandable-section'
import { TaskDataTable } from '../tasks/data-table'

interface DashboardAssignedTasksSectionProps {
  personId: string
}

export function DashboardAssignedTasksSection({
  personId,
}: DashboardAssignedTasksSectionProps) {
  return (
    <ExpandableSection
      title='Assigned Tasks'
      viewAllHref='/my-tasks'
      icon='ListTodo'
    >
      <TaskDataTable
        hideFilters={true}
        immutableFilters={{
          assigneeId: personId,
          status: [
            TASK_STATUS.TODO,
            TASK_STATUS.DOING,
            TASK_STATUS.BLOCKED,
          ].join(','),
        }}
      />
    </ExpandableSection>
  )
}
