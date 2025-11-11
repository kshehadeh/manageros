import { getInitiativeTaskCompletionCounts } from '@/lib/actions/task'

interface InitiativeCompletionRateProps {
  initiativeId: string
}

export async function InitiativeCompletionRate({
  initiativeId,
}: InitiativeCompletionRateProps) {
  // Get task completion counts using optimized query
  const { total, completed } =
    await getInitiativeTaskCompletionCounts(initiativeId)

  // Calculate completion percentage
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100)

  return <div>{completionRate}% complete</div>
}
