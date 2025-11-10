import { getAllTasksForInitiative } from '@/lib/actions/task'
import { calculateTaskCompletionPercentage } from '@/lib/completion-utils'

interface InitiativeCompletionRateProps {
  initiativeId: string
}

export async function InitiativeCompletionRate({
  initiativeId,
}: InitiativeCompletionRateProps) {
  // Fetch all tasks for completion rate calculation
  const allTasks = await getAllTasksForInitiative(initiativeId)
  const completionRate = calculateTaskCompletionPercentage(allTasks)

  return <div>{completionRate}% complete</div>
}
