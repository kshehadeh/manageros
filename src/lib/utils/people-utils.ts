import { Person } from '@/types/person'
import { prisma } from '@/lib/db'

export type GroupingOption = 'manager' | 'team' | 'status' | 'jobRole' | 'none'

export interface PeopleGroup {
  key: string
  label: string
  people: Person[]
  count: number
  link?: {
    href: string
    type: 'person' | 'team' | 'jobRole'
  }
}

/**
 * Groups people based on the specified grouping option
 * @param people - Array of people to group
 * @param groupingOption - The grouping criteria to use
 * @returns Array of grouped people
 */
export function groupPeople(
  people: Person[],
  groupingOption: GroupingOption
): PeopleGroup[] {
  const groups: PeopleGroup[] = []

  switch (groupingOption) {
    case 'manager':
      return groupByManager(people)
    case 'team':
      return groupByTeam(people)
    case 'status':
      return groupByStatus(people)
    case 'jobRole':
      return groupByJobRole(people)
    case 'none':
      return groupByNone(people)
    default:
      return groups
  }
}

/**
 * Groups people by their manager
 */
function groupByManager(people: Person[]): PeopleGroup[] {
  const groups: PeopleGroup[] = []
  const managerGroups = new Map<string, Person[]>()

  people.forEach(person => {
    const key = person.manager?.id || 'no-manager'
    if (!managerGroups.has(key)) {
      managerGroups.set(key, [])
    }
    managerGroups.get(key)!.push(person)
  })

  // Create groups
  managerGroups.forEach((people, key) => {
    // Find the manager from the first person in the group
    const manager = people[0]?.manager

    const group: PeopleGroup = {
      key,
      label: manager?.name || 'No Manager',
      people: people.sort((a, b) => a.name.localeCompare(b.name)),
      count: people.length,
    }

    // Add link for manager if it exists and is not "no-manager"
    if (key !== 'no-manager' && manager) {
      group.link = {
        href: `/people/${key}`,
        type: 'person',
      }
    }

    groups.push(group)
  })

  // Sort groups by manager name
  groups.sort((a, b) => {
    if (a.key === 'no-manager') return 1
    if (b.key === 'no-manager') return -1
    return a.label.localeCompare(b.label)
  })

  return groups
}

/**
 * Groups people by their team
 */
function groupByTeam(people: Person[]): PeopleGroup[] {
  const groups: PeopleGroup[] = []
  const teamGroups = new Map<string, Person[]>()

  people.forEach(person => {
    const key = person.team?.id || 'no-team'
    if (!teamGroups.has(key)) {
      teamGroups.set(key, [])
    }
    teamGroups.get(key)!.push(person)
  })

  // Create groups
  teamGroups.forEach((people, key) => {
    const team = people.find(p => p.team?.id === key)?.team

    const group: PeopleGroup = {
      key,
      label: team?.name || 'No Team',
      people: people.sort((a, b) => a.name.localeCompare(b.name)),
      count: people.length,
    }

    // Add link for team if it exists and is not "no-team"
    if (key !== 'no-team' && team) {
      group.link = {
        href: `/teams/${key}`,
        type: 'team',
      }
    }

    groups.push(group)
  })

  // Sort groups by team name
  groups.sort((a, b) => {
    if (a.key === 'no-team') return 1
    if (b.key === 'no-team') return -1
    return a.label.localeCompare(b.label)
  })

  return groups
}

/**
 * Groups people by their status
 */
function groupByStatus(people: Person[]): PeopleGroup[] {
  const groups: PeopleGroup[] = []
  const statusGroups = new Map<string, Person[]>()

  people.forEach(person => {
    const status = person.status
    if (!statusGroups.has(status)) {
      statusGroups.set(status, [])
    }
    statusGroups.get(status)!.push(person)
  })

  // Create groups in a specific order
  const statusOrder = ['active', 'inactive', 'on_leave', 'terminated']
  statusOrder.forEach(status => {
    const people = statusGroups.get(status) || []
    if (people.length > 0) {
      groups.push({
        key: status,
        label:
          status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
        people: people.sort((a, b) => a.name.localeCompare(b.name)),
        count: people.length,
      })
    }
  })

  return groups
}

/**
 * Groups people by their job role
 */
function groupByJobRole(people: Person[]): PeopleGroup[] {
  const groups: PeopleGroup[] = []
  const jobRoleGroups = new Map<string, Person[]>()

  people.forEach(person => {
    const key = person.jobRole?.id || 'no-job-role'
    if (!jobRoleGroups.has(key)) {
      jobRoleGroups.set(key, [])
    }
    jobRoleGroups.get(key)!.push(person)
  })

  // Create groups
  jobRoleGroups.forEach((people, key) => {
    const jobRole = people.find(p => p.jobRole?.id === key)?.jobRole

    const group: PeopleGroup = {
      key,
      label: jobRole?.title || 'No Job Role',
      people: people.sort((a, b) => a.name.localeCompare(b.name)),
      count: people.length,
    }

    // Add link for job role if it exists and is not "no-job-role"
    if (key !== 'no-job-role' && jobRole) {
      group.link = {
        href: `/job-roles/${key}`,
        type: 'jobRole',
      }
    }

    groups.push(group)
  })

  // Sort groups by job role title
  groups.sort((a, b) => {
    if (a.key === 'no-job-role') return 1
    if (b.key === 'no-job-role') return -1
    return a.label.localeCompare(b.label)
  })

  return groups
}

/**
 * Returns all people in a single group (no grouping)
 */
function groupByNone(people: Person[]): PeopleGroup[] {
  if (people.length === 0) {
    return []
  }

  return [
    {
      key: 'all',
      label: 'All People',
      people: people.sort((a, b) => a.name.localeCompare(b.name)),
      count: people.length,
    },
  ]
}

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
