import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testTeamCreationDirect() {
  try {
    console.log('Testing team creation directly...')
    
    // Get the first organization
    const org = await prisma.organization.findFirst()
    if (!org) {
      console.log('❌ No organization found')
      return
    }
    
    console.log('✓ Using organization:', org.name)
    
    // Test creating a team without parent
    const team1 = await prisma.team.create({
      data: {
        name: 'Test Team 1',
        description: 'A test team without parent',
        organizationId: org.id,
        parentId: null
      }
    })
    
    console.log('✓ Created team without parent:', team1.name)
    
    // Test creating a team with parent
    const team2 = await prisma.team.create({
      data: {
        name: 'Test Team 2',
        description: 'A test team with parent',
        organizationId: org.id,
        parentId: team1.id
      }
    })
    
    console.log('✓ Created team with parent:', team2.name, 'parent:', team1.name)
    
    // Test creating a team with empty string parentId (should be converted to null)
    const team3 = await prisma.team.create({
      data: {
        name: 'Test Team 3',
        description: 'A test team with empty parentId',
        organizationId: org.id,
        parentId: '' // This should be converted to null
      }
    })
    
    console.log('✓ Created team with empty parentId:', team3.name, 'parentId:', team3.parentId)
    
    // Clean up test teams
    await prisma.team.deleteMany({
      where: {
        name: {
          startsWith: 'Test Team'
        }
      }
    })
    
    console.log('✓ Cleaned up test teams')
    console.log('🎉 All team creation tests passed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testTeamCreationDirect().catch(console.error)
