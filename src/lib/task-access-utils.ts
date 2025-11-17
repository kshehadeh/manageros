/**
 * Task Access Control Utilities
 *
 * Tasks are accessible if they are:
 * 1. Created by the current user within their organization, OR
 * 2. Assigned to the current user AND associated with an initiative in the same organization, OR
 * 3. Associated with objectives of initiatives in the same organization
 */
export function getTaskAccessWhereClause(
  organizationId: string,
  userId: string,
  personId?: string
) {
  const conditions: Array<Record<string, unknown>> = [
    // Tasks created by the current user in their organization
    {
      createdBy: {
        id: userId,
      },
    },
    // Tasks associated with initiatives in the same organization
    { initiative: { organizationId } },
    // Tasks associated with objectives of initiatives in the same organization
    { objective: { initiative: { organizationId } } },
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
