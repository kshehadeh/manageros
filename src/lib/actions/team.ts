'use server'

import { prisma } from '@/lib/db'
import { teamSchema, type TeamFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'
import type {
  TeamWithHierarchy,
  TeamForSelection,
  TeamWithRelations,
  TeamWithCounts,
} from '@/types/team'

export async function getTeams() {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return []
    }
    return await prisma.team.findMany({
      where: { organizationId: user.organizationId },
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
export async function getAllTeamsWithRelations(): Promise<TeamWithCounts[]> {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return []
    }
    return await prisma.team.findMany({
      where: { organizationId: user.organizationId },
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
export async function getTeamHierarchy(
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
export async function getCompleteTeamHierarchy(): Promise<TeamWithHierarchy[]> {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return []
    }

    return await getTeamHierarchy(user.organizationId, null)
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
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return []
    }

    // Fetch all teams for the organization in a single query
    const allTeams = await prisma.team.findMany({
      where: { organizationId: user.organizationId },
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

  // Debug logging
  console.log('Creating team for user:', {
    id: user.id,
    email: user.email,
    organizationId: user.organizationId,
    role: user.role,
    organizationName: user.organizationName,
  })

  // Additional validation
  if (!user.organizationId) {
    console.error('❌ User has no organizationId!', user)
    throw new Error('User is not associated with an organization')
  }

  // Verify organization exists
  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId },
  })

  if (!organization) {
    console.error('❌ Organization not found!', {
      organizationId: user.organizationId,
    })
    throw new Error('Organization not found')
  }

  console.log('✅ Organization found:', organization.name)

  // Validate the form data
  const validatedData = teamSchema.parse(formData)

  console.log('Validated form data:', validatedData)

  // Validate parent team if provided
  if (validatedData.parentId) {
    const parentTeam = await prisma.team.findFirst({
      where: {
        id: validatedData.parentId,
        organizationId: user.organizationId,
      },
    })

    if (!parentTeam) {
      throw new Error('Parent team not found or access denied')
    }
  }

  // Create the team
  await prisma.team.create({
    data: {
      name: validatedData.name,
      description: validatedData.description,
      avatar:
        validatedData.avatar && validatedData.avatar.trim() !== ''
          ? validatedData.avatar
          : null,
      organizationId: user.organizationId,
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

  // Redirect to the teams page
  redirect('/teams')
}

export async function updateTeam(id: string, formData: TeamFormData) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to update teams')
  }

  // Validate the form data
  const validatedData = teamSchema.parse(formData)

  // Verify team belongs to user's organization
  const existingTeam = await prisma.team.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
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
        organizationId: user.organizationId,
      },
    })

    if (!parentTeam) {
      throw new Error('Parent team not found or access denied')
    }
  }

  // Update the team
  await prisma.team.update({
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

  // Redirect to the teams page
  redirect('/teams')
}

export async function deleteTeam(id: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to delete teams')
  }

  // Verify team belongs to user's organization
  const existingTeam = await prisma.team.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
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
    if (!user.organizationId) {
      return null
    }
    return await prisma.team.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
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

export async function getTeamsForSelection(
  excludeId?: string
): Promise<TeamForSelection[]> {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return []
    }
    return await prisma.team.findMany({
      where: {
        organizationId: user.organizationId,
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
