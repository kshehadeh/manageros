import { prisma } from '@/lib/db'

export async function getEntityLinks(
  entityType: string,
  entityId: string,
  organizationId: string,
  options?: {
    includeCreatedBy?: boolean
  }
) {
  const include: Record<string, unknown> = {}
  if (options?.includeCreatedBy) {
    include.createdBy = {
      select: {
        id: true,
        name: true,
        email: true,
      },
    }
  }

  return prisma.entityLink.findMany({
    where: {
      entityType,
      entityId,
      organizationId,
    },
    include: Object.keys(include).length > 0 ? include : undefined,
    orderBy: { createdAt: 'desc' },
  })
}
