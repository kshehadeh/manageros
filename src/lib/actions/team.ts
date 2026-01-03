'use server'

import { prisma } from '@/lib/db'
import { teamSchema, type TeamFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth-utils'
import type {
  TeamWithHierarchy,
  TeamForSelection,
  TeamWithRelations,
  TeamWithCounts,
} from '@/types/team'
import {
  checkOrganizationLimit,
  getOrganizationCounts,
} from '@/lib/subscription-utils'

export async function getTeams() {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      return []
    }
    return await prisma.team.findMany({
      where: { organizationId: user.managerOSOrganizationId },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return []
  }
}

/**
 * Gets all teams with parent info and relation counts for data table display
 * Returns a flat list of all teams (not hierarchical)
 */
async function getAllTeamsWithRelations(): Promise<TeamWithCounts[]> {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      return []
    }
    return await prisma.team.findMany({
      where: { organizationId: user.managerOSOrganizationId },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            people: true,
            initiatives: true,
            children: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching all teams with relations:', error)
    return []
  }
}

/**
 * Recursively fetches team hierarchy with all related data
 * This is more efficient than deeply nested includes and handles unlimited depth
 */
async function getTeamHierarchy(
  organizationId: string,
  parentId: string | null = null
): Promise<TeamWithHierarchy[]> {
  const teams = await prisma.team.findMany({
    where: {
      organizationId,
      parentId,
    },
    include: {
      people: true,
      initiatives: true,
      parent: true,
    },
    orderBy: { name: 'asc' },
  })

  // Recursively fetch children for each team
  const teamsWithChildren = await Promise.all(
    teams.map(async team => {
      const children = await getTeamHierarchy(organizationId, team.id)
      return {
        ...team,
        children,
      }
    })
  )

  return teamsWithChildren
}

/**
 * Gets the complete team hierarchy for an organization
 * Returns only top-level teams with their full nested structure
 * Uses caching for better performance
 */
async function getCompleteTeamHierarchy(): Promise<TeamWithHierarchy[]> {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      return []
    }

    return await getTeamHierarchy(user.managerOSOrganizationId || '', null)
  } catch (error) {
    console.error('Error fetching team hierarchy:', error)
    return []
  }
}

/**
 * Alternative approach: Fetch all teams at once and build hierarchy in memory
 * This can be more efficient for large hierarchies with many teams
 */
export async function getTeamHierarchyOptimized(): Promise<
  TeamWithHierarchy[]
> {
  const user = await getCurrentUser()
  try {
    if (!user.managerOSOrganizationId) {
      return []
    }

    // Fetch all teams for the organization in a single query
    const allTeams = await prisma.team.findMany({
      where: { organizationId: user.managerOSOrganizationId },
      include: {
        people: true,
        initiatives: true,
        parent: true,
      },
      orderBy: { name: 'asc' },
    })

    // Build hierarchy in memory
    const teamMap = new Map<string, TeamWithHierarchy>()
    const rootTeams: TeamWithHierarchy[] = []

    // First pass: create team objects and map them
    allTeams.forEach(team => {
      teamMap.set(team.id, {
        ...team,
        children: [],
      })
    })

    // Second pass: build parent-child relationships
    allTeams.forEach(team => {
      const teamWithChildren = teamMap.get(team.id)!
      if (team.parentId) {
        const parent = teamMap.get(team.parentId)
        if (parent) {
          parent.children.push(teamWithChildren)
        }
      } else {
        rootTeams.push(teamWithChildren)
      }
    })

    return rootTeams
  } catch (error) {
    console.error('Error fetching optimized team hierarchy:', error)
    return []
  }
}

export async function createTeam(formData: TeamFormData) {
  const user = await getCurrentUser()

  // Additional validation
  if (!user.managerOSOrganizationId) {
    console.error('❌ User has no organizationId!', user)
    throw new Error('User is not associated with an organization')
  }

  // Verify organization exists
  const organization = await prisma.organization.findUnique({
    where: { id: user.managerOSOrganizationId },
  })

  if (!organization) {
    console.error('❌ Organization not found!', {
      organizationId: user.managerOSOrganizationId,
    })
    throw new Error('Organization not found')
  }

  // Validate the form data
  const validatedData = teamSchema.parse(formData)

  // Validate parent team if provided
  if (validatedData.parentId) {
    const parentTeam = await prisma.team.findFirst({
      where: {
        id: validatedData.parentId,
        organizationId: user.managerOSOrganizationId,
      },
    })

    if (!parentTeam) {
      throw new Error('Parent team not found or access denied')
    }
  }

  // Check organization limits before creating
  const counts = await getOrganizationCounts(user.managerOSOrganizationId)
  const limitCheck = await checkOrganizationLimit(
    user.managerOSOrganizationId,
    'teams',
    counts?.teams ?? 0
  )

  if (!limitCheck) {
    throw new Error('Teams limit exceeded')
  }

  // Create the team
  const createdTeam = await prisma.team.create({
    data: {
      name: validatedData.name,
      description: validatedData.description,
      avatar:
        validatedData.avatar && validatedData.avatar.trim() !== ''
          ? validatedData.avatar
          : null,
      organizationId: user.managerOSOrganizationId,
      parentId:
        validatedData.parentId && validatedData.parentId.trim() !== ''
          ? validatedData.parentId
          : null,
    },
    include: {
      people: true,
      initiatives: true,
      parent: true,
      children: true,
    },
  })

  // Revalidate the teams page
  revalidatePath('/teams')

  // Return the created team
  return createdTeam
}

export async function updateTeam(id: string, formData: TeamFormData) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update teams')
  }

  // Validate the form data
  const validatedData = teamSchema.parse(formData)

  // Verify team belongs to user's organization
  const existingTeam = await prisma.team.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
  })
  if (!existingTeam) {
    throw new Error('Team not found or access denied')
  }

  // Validate parent team if provided
  if (validatedData.parentId) {
    // Prevent self-reference
    if (validatedData.parentId === id) {
      throw new Error('Team cannot be its own parent')
    }

    const parentTeam = await prisma.team.findFirst({
      where: {
        id: validatedData.parentId,
        organizationId: user.managerOSOrganizationId,
      },
    })

    if (!parentTeam) {
      throw new Error('Parent team not found or access denied')
    }
  }

  // Update the team
  const updatedTeam = await prisma.team.update({
    where: { id },
    data: {
      name: validatedData.name,
      description: validatedData.description,
      avatar:
        validatedData.avatar && validatedData.avatar.trim() !== ''
          ? validatedData.avatar
          : null,
      parentId:
        validatedData.parentId && validatedData.parentId.trim() !== ''
          ? validatedData.parentId
          : null,
    },
    include: {
      people: true,
      initiatives: true,
      parent: true,
      children: true,
    },
  })

  // Revalidate the teams page
  revalidatePath('/teams')

  // Return the updated team
  return updatedTeam
}

export async function deleteTeam(id: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to delete teams')
  }

  // Verify team belongs to user's organization
  const existingTeam = await prisma.team.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
    include: {
      people: true,
      initiatives: true,
      children: true,
    },
  })

  if (!existingTeam) {
    throw new Error('Team not found or access denied')
  }

  // Check if team has people or initiatives
  if (existingTeam.people.length > 0) {
    throw new Error(
      `Cannot delete team "${existingTeam.name}" because it has ${existingTeam.people.length} member(s). Please reassign or remove team members first.`
    )
  }

  if (existingTeam.initiatives.length > 0) {
    throw new Error(
      `Cannot delete team "${existingTeam.name}" because it has ${existingTeam.initiatives.length} initiative(s). Please reassign or delete initiatives first.`
    )
  }

  // Check if team has child teams
  if (existingTeam.children.length > 0) {
    throw new Error(
      `Cannot delete team "${existingTeam.name}" because it has ${existingTeam.children.length} child team(s). Please delete or reassign child teams first.`
    )
  }

  // Delete the team
  await prisma.team.delete({
    where: { id },
  })

  // Revalidate the teams page
  revalidatePath('/teams')
}

export async function getTeam(id: string): Promise<TeamWithRelations | null> {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      return null
    }
    return await prisma.team.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
      },
      include: {
        people: true,
        initiatives: true,
        parent: true,
        children: true,
      },
    })
  } catch (error) {
    console.error('Error fetching team:', error)
    return null
  }
}

async function getTeamsForSelection(
  excludeId?: string
): Promise<TeamForSelection[]> {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      return []
    }
    return await prisma.team.findMany({
      where: {
        organizationId: user.managerOSOrganizationId,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: {
        id: true,
        name: true,
        parentId: true,
      },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching teams for selection:', error)
    return []
  }
}

/**
 * Gets aggregate statistics for all teams in the organization
 */
export async function getTeamStatistics() {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      return {
        totalTeams: 0,
        totalMembers: 0,
        totalSubteams: 0,
      }
    }

    const teams = await prisma.team.findMany({
      where: { organizationId: user.managerOSOrganizationId },
      include: {
        _count: {
          select: {
            people: true,
            children: true,
          },
        },
      },
    })

    const totalTeams = teams.length
    const totalMembers = teams.reduce(
      (sum, team) => sum + team._count.people,
      0
    )
    const totalSubteams = teams.reduce(
      (sum, team) => sum + team._count.children,
      0
    )

    return {
      totalTeams,
      totalMembers,
      totalSubteams,
    }
  } catch (error) {
    console.error('Error fetching team statistics:', error)
    return {
      totalTeams: 0,
      totalMembers: 0,
      totalSubteams: 0,
    }
  }
}
