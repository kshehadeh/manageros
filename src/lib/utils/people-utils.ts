import { prisma } from '@/lib/db'

/**
 * Checks if a person is a direct or indirect manager of another person, or if they are the same person
 * @param managerId - The ID of the potential manager
 * @param reportId - The ID of the potential report
 * @returns true if the manager is a direct or indirect manager of the report, or if they are the same person
 */
export async function checkIfManagerOrSelf(
  managerId: string,
  reportId: string
): Promise<boolean> {
  if (managerId === reportId) {
    return true
  }

  // First check if it's a direct manager relationship
  const directReport = await prisma.person.findFirst({
    where: {
      id: reportId,
      managerId: managerId,
    },
  })

  if (directReport) {
    return true
  }

  // If not direct, check if it's an indirect relationship by traversing up the hierarchy
  let currentPerson = await prisma.person.findUnique({
    where: { id: reportId },
    select: { managerId: true },
  })

  while (currentPerson?.managerId) {
    if (currentPerson.managerId === managerId) {
      return true
    }

    currentPerson = await prisma.person.findUnique({
      where: { id: currentPerson.managerId },
      select: { managerId: true },
    })
  }

  return false
}
