import 'server-only'

import { cache } from 'react'
import { prisma } from '@/lib/db'

export const getFeedbackCountForPerson = cache(
  async (aboutPersonId: string, currentPersonId?: string) => {
    const where: Record<string, unknown> = {
      aboutId: aboutPersonId,
      OR: [
        { isPrivate: false },
        ...(currentPersonId ? [{ fromId: currentPersonId }] : []),
      ],
    }

    return prisma.feedback.count({
      where,
    })
  }
)
