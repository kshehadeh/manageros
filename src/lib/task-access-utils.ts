/**
 * Task Access Control Utilities
 *
 * Tasks are accessible if they are:
 * 1. Associated with initiatives in the same organization, OR
 * 2. Associated with objectives of initiatives in the same organization, OR
 * 3. Assigned to the current user AND associated with an initiative in the same organization, OR
 * 4. Created by the current user AND the creator is currently in the current organization
 *    (for tasks without initiatives/objectives)
 *
 * Note: This ensures organization isolation - tasks from other organizations are not accessible
 * even if they were created by the current user.
 */
export function getTaskAccessWhereClause(
  organizationId: string,
  userId: string,
  personId?: string
) {
  const conditions: Array<Record<string, unknown>> = [
    // Tasks associated with initiatives in the same organization
    { initiative: { organizationId } },
    // Tasks associated with objectives of initiatives in the same organization
    { objective: { initiative: { organizationId } } },
    // Tasks created by the current user AND creator is in the current organization
    // (for tasks without initiatives/objectives)
    {
      AND: [
        { createdBy: { id: userId } },
        {
          createdBy: {
            organizationMemberships: {
              some: {
                organizationId,
              },
            },
          },
        },
        // Ensure task has no initiative AND no objective (standalone tasks)
        {
          AND: [{ initiativeId: null }, { objectiveId: null }],
        },
      ],
    },
  ]

  // Add condition for tasks assigned to the current user AND associated with initiatives
  if (personId) {
    conditions.push({
      assigneeId: personId,
      initiative: { organizationId },
    })
  }

  return {
    OR: conditions,
  }
}
