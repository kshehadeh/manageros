'use server'

import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-utils'

export async function getFeedbackTemplates() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to view feedback templates'
    )
  }

  const templates = await prisma.feedbackTemplate.findMany({
    include: {
      questions: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return templates
}
