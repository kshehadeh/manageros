import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testActionDirect() {
  try {
    console.log('Testing team creation action directly...')
    
    // Get a user and organization
    const user = await prisma.user.findUnique({
      where: { email: 'admin@acme.com' },
      include: { organization: true }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('✓ Using user:', user.email, 'org:', user.organization.name)
    
    // Test form data
    const formData = {
      name: 'Direct Test Team',
      description: 'Testing direct action call',
      parentId: undefined
    }
    
    console.log('✓ Form data:', formData)
    
    // Simulate validation (transform empty string to undefined)
    const validatedData = {
      ...formData,
      parentId: formData.parentId === '' ? undefined : formData.parentId
    }
    console.log('✓ Validated data:', validatedData)
    
    // Create the team directly
    const team = await prisma.team.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        organizationId: user.organizationId,
        parentId: validatedData.parentId && validatedData.parentId.trim() !== '' ? validatedData.parentId : null,
      }
    })
    
    console.log('✓ Successfully created team:', team.name)
    
    // Clean up
    await prisma.team.delete({ where: { id: team.id } })
    console.log('✓ Cleaned up test team')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testActionDirect().catch(console.error)
