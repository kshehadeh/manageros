import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function debugUser() {
  try {
    console.log('Debugging user and organization...')
    
    // Check the admin user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@acme.com' },
      include: { organization: true }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('✓ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      organization: user.organization.name
    })
    
    // Check if the organization exists
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId }
    })
    
    if (!org) {
      console.log('❌ Organization not found')
      return
    }
    
    console.log('✓ Organization found:', {
      id: org.id,
      name: org.name,
      slug: org.slug
    })
    
    // Try to create a team with the same organizationId
    try {
      const testTeam = await prisma.team.create({
        data: {
          name: 'Debug Test Team',
          description: 'Testing team creation',
          organizationId: user.organizationId,
          parentId: null
        }
      })
      
      console.log('✓ Successfully created test team:', testTeam.name)
      
      // Clean up
      await prisma.team.delete({ where: { id: testTeam.id } })
      console.log('✓ Cleaned up test team')
      
    } catch (error) {
      console.log('❌ Failed to create test team:', error.message)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugUser()
