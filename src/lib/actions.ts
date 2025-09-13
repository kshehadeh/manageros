'use server'

import { prisma } from '@/lib/db'
import { initiativeSchema, type InitiativeFormData, personSchema, type PersonFormData, teamSchema, type TeamFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createInitiative(formData: InitiativeFormData) {
  try {
    // Validate the form data
    const validatedData = initiativeSchema.parse(formData)
    
    // Parse dates if provided
    const startDate = validatedData.startDate ? new Date(validatedData.startDate) : null
    const targetDate = validatedData.targetDate ? new Date(validatedData.targetDate) : null
    
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
  } catch (error) {
    console.error('Error creating initiative:', error)
    throw new Error('Failed to create initiative')
  }
}

export async function getTeams() {
  try {
    return await prisma.team.findMany({
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return []
  }
}

export async function getPeople() {
  try {
    return await prisma.person.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching people:', error)
    return []
  }
}

export async function createPerson(formData: PersonFormData) {
  try {
    // Validate the form data
    const validatedData = personSchema.parse(formData)
    
    // Parse startedAt date if provided
    const startedAt = validatedData.startedAt ? new Date(validatedData.startedAt) : null
    
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
  } catch (error) {
    console.error('Error creating person:', error)
    throw new Error('Failed to create person')
  }
}

export async function updatePerson(id: string, formData: PersonFormData) {
  try {
    // Validate the form data
    const validatedData = personSchema.parse(formData)
    
    // Parse startedAt date if provided
    const startedAt = validatedData.startedAt ? new Date(validatedData.startedAt) : null
    
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
  } catch (error) {
    console.error('Error updating person:', error)
    throw new Error('Failed to update person')
  }
}

export async function getPerson(id: string) {
  try {
    return await prisma.person.findUnique({
      where: { id },
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
  try {
    // Validate the form data
    const validatedData = teamSchema.parse(formData)
    
    // Create the team
    const team = await prisma.team.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
      },
      include: {
        people: true,
        initiatives: true,
      },
    })

    // Revalidate the teams page
    revalidatePath('/teams')
    
    // Redirect to the teams page
    redirect('/teams')
  } catch (error) {
    console.error('Error creating team:', error)
    throw new Error('Failed to create team')
  }
}

export async function updateTeam(id: string, formData: TeamFormData) {
  try {
    // Validate the form data
    const validatedData = teamSchema.parse(formData)
    
    // Update the team
    const team = await prisma.team.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
      },
      include: {
        people: true,
        initiatives: true,
      },
    })

    // Revalidate the teams page
    revalidatePath('/teams')
    
    // Redirect to the teams page
    redirect('/teams')
  } catch (error) {
    console.error('Error updating team:', error)
    throw new Error('Failed to update team')
  }
}

export async function getTeam(id: string) {
  try {
    return await prisma.team.findUnique({
      where: { id },
      include: {
        people: true,
        initiatives: true,
      },
    })
  } catch (error) {
    console.error('Error fetching team:', error)
    return null
  }
}
