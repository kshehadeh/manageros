import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTeams() {
  try {
    console.log('Checking teams in database...')
    
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        organizationId: true,
        parentId: true
      }
    })
    
    console.log('Teams:', teams)
    
    // Check if any teams are missing organizationId
    const teamsWithoutOrg = teams.filter(team => !team.organizationId)
    if (teamsWithoutOrg.length > 0) {
      console.log('❌ Teams missing organizationId:', teamsWithoutOrg)
    } else {
      console.log('✓ All teams have organizationId')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTeams()
