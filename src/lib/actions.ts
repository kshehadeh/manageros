'use server'

import { prisma } from '@/lib/db'
import { initiativeSchema, type InitiativeFormData, personSchema, type PersonFormData, teamSchema, type TeamFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdmin, canAccessOrganization } from '@/lib/auth'

async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session.user
}

export async function createOrganization(formData: { name: string; slug: string }) {
  const user = await getCurrentUser()
  
  // Check if user already has an organization
  if (user.organizationId) {
    throw new Error('User already belongs to an organization')
  }
  
  // Check if organization slug already exists
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: formData.slug }
  })
  
  if (existingOrg) {
    throw new Error('Organization slug already exists')
  }
  
  // Create organization and update user in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create organization
    const organization = await tx.organization.create({
      data: {
        name: formData.name,
        slug: formData.slug
      }
    })
    
    // Update user to be admin of the organization
    await tx.user.update({
      where: { id: user.id },
      data: {
        organizationId: organization.id,
        role: 'ADMIN'
      }
    })
    
    return organization
  })
  
  revalidatePath('/')
  return result
}

export async function createInitiative(formData: InitiativeFormData) {
  const user = await getCurrentUser()
  
  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to create initiatives')
  }
  
  // Validate the form data
  const validatedData = initiativeSchema.parse(formData)
  
  // Parse dates if provided
  const startDate = validatedData.startDate ? new Date(validatedData.startDate) : null
  const targetDate = validatedData.targetDate ? new Date(validatedData.targetDate) : null
  
  // Verify team belongs to user's organization if specified
  if (validatedData.teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: validatedData.teamId,
        organizationId: user.organizationId
      }
    })
    if (!team) {
      throw new Error('Team not found or access denied')
    }
  }
  
  // Create the initiative with objectives and owners
  const initiative = await prisma.initiative.create({
    data: {
      title: validatedData.title,
      summary: validatedData.summary,
      outcome: validatedData.outcome,
      startDate,
      targetDate,
      status: validatedData.status,
      rag: validatedData.rag,
      confidence: validatedData.confidence,
      teamId: validatedData.teamId,
      organizationId: user.organizationId,
      objectives: {
        create: validatedData.objectives?.map((obj, index) => ({
          title: obj.title,
          keyResult: obj.keyResult,
          sortIndex: index,
        })) || [],
      },
      owners: {
        create: validatedData.owners?.map(owner => ({
          personId: owner.personId,
          role: owner.role,
        })) || [],
      },
    },
    include: {
      objectives: true,
      owners: {
        include: {
          person: true,
        },
      },
      team: true,
    },
  })

  // Revalidate the initiatives page
  revalidatePath('/initiatives')
  
  // Redirect to the new initiative
  redirect(`/initiatives/${initiative.id}`)
}

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

export async function getPeople() {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return []
    }
    return await prisma.person.findMany({
      where: { 
        status: 'active',
        organizationId: user.organizationId
      },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching people:', error)
    return []
  }
}

export async function createPerson(formData: PersonFormData) {
  const user = await getCurrentUser()
  
  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to create people')
  }
  
  // Validate the form data
  const validatedData = personSchema.parse(formData)
  
  // Parse startedAt date if provided
  const startedAt = validatedData.startedAt ? new Date(validatedData.startedAt) : null
  
  // Verify team belongs to user's organization if specified
  if (validatedData.teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: validatedData.teamId,
        organizationId: user.organizationId
      }
    })
    if (!team) {
      throw new Error('Team not found or access denied')
    }
  }
  
  // Verify manager belongs to user's organization if specified
  if (validatedData.managerId) {
    const manager = await prisma.person.findFirst({
      where: {
        id: validatedData.managerId,
        organizationId: user.organizationId
      }
    })
    if (!manager) {
      throw new Error('Manager not found or access denied')
    }
  }
  
  // Create the person
  const person = await prisma.person.create({
    data: {
      name: validatedData.name,
      email: validatedData.email,
      role: validatedData.role,
      status: validatedData.status,
      teamId: validatedData.teamId || null,
      managerId: validatedData.managerId || null,
      startedAt,
      organizationId: user.organizationId,
    },
    include: {
      team: true,
      manager: true,
    },
  })

  // Revalidate the people page
  revalidatePath('/people')
  
  // Redirect to the people page
  redirect('/people')
}

export async function updatePerson(id: string, formData: PersonFormData) {
  const user = await getCurrentUser()
  
  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to update people')
  }
  
  // Validate the form data
  const validatedData = personSchema.parse(formData)
  
  // Parse startedAt date if provided
  const startedAt = validatedData.startedAt ? new Date(validatedData.startedAt) : null
  
  // Verify person belongs to user's organization
  const existingPerson = await prisma.person.findFirst({
    where: {
      id,
      organizationId: user.organizationId
    }
  })
  if (!existingPerson) {
    throw new Error('Person not found or access denied')
  }
  
  // Verify team belongs to user's organization if specified
  if (validatedData.teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: validatedData.teamId,
        organizationId: user.organizationId
      }
    })
    if (!team) {
      throw new Error('Team not found or access denied')
    }
  }
  
  // Verify manager belongs to user's organization if specified
  if (validatedData.managerId) {
    const manager = await prisma.person.findFirst({
      where: {
        id: validatedData.managerId,
        organizationId: user.organizationId
      }
    })
    if (!manager) {
      throw new Error('Manager not found or access denied')
    }
  }
  
  // Update the person
  const person = await prisma.person.update({
    where: { id },
    data: {
      name: validatedData.name,
      email: validatedData.email,
      role: validatedData.role,
      status: validatedData.status,
      teamId: validatedData.teamId || null,
      managerId: validatedData.managerId || null,
      startedAt,
    },
    include: {
      team: true,
      manager: true,
    },
  })

  // Revalidate the people page
  revalidatePath('/people')
  
  // Redirect to the people page
  redirect('/people')
}

export async function getPerson(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return null
    }
    return await prisma.person.findFirst({
      where: {
        id,
        organizationId: user.organizationId
      },
      include: {
        team: true,
        manager: true,
        reports: true,
      },
    })
  } catch (error) {
    console.error('Error fetching person:', error)
    return null
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
    organizationName: user.organizationName
  })
  
  // Additional validation
  if (!user.organizationId) {
    console.error('❌ User has no organizationId!', user)
    throw new Error('User is not associated with an organization')
  }
  
  // Verify organization exists
  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId }
  })
  
  if (!organization) {
    console.error('❌ Organization not found!', { organizationId: user.organizationId })
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
        organizationId: user.organizationId
      }
    })
    
    if (!parentTeam) {
      throw new Error('Parent team not found or access denied')
    }
  }
  
  // Create the team
  const team = await prisma.team.create({
    data: {
      name: validatedData.name,
      description: validatedData.description,
      organizationId: user.organizationId,
      parentId: validatedData.parentId && validatedData.parentId.trim() !== '' ? validatedData.parentId : null,
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
      organizationId: user.organizationId
    }
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
        organizationId: user.organizationId
      }
    })
    
    if (!parentTeam) {
      throw new Error('Parent team not found or access denied')
    }
  }
  
  // Update the team
  const team = await prisma.team.update({
    where: { id },
    data: {
      name: validatedData.name,
      description: validatedData.description,
      parentId: validatedData.parentId && validatedData.parentId.trim() !== '' ? validatedData.parentId : null,
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

export async function getTeam(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return null
    }
    return await prisma.team.findFirst({
      where: {
        id,
        organizationId: user.organizationId
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

export async function getTeamsForSelection(excludeId?: string) {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return []
    }
    return await prisma.team.findMany({
      where: {
        organizationId: user.organizationId,
        ...(excludeId && { id: { not: excludeId } })
      },
      select: {
        id: true,
        name: true,
        parentId: true,
      },
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Error fetching teams for selection:', error)
    return []
  }
}
