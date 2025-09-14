import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function debugAuth() {
  try {
    console.log('Debugging authentication...')
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: 'admin@acme.com' },
      include: { organization: true }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('✓ User found:', {
      email: user.email,
      name: user.name,
      role: user.role,
      organization: user.organization.name
    })
    
    // Test password verification
    const testPassword = 'password123'
    const isPasswordValid = await bcrypt.compare(testPassword, user.passwordHash)
    
    console.log('✓ Password verification:', isPasswordValid)
    
    if (isPasswordValid) {
      console.log('✓ Authentication should work')
    } else {
      console.log('❌ Password verification failed')
      
      // Let's check what password hash we have
      console.log('Password hash:', user.passwordHash)
      
      // Try to hash the password again to see if it matches
      const newHash = await bcrypt.hash(testPassword, 12)
      console.log('New hash:', newHash)
      console.log('Hashes match:', newHash === user.passwordHash)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugAuth()
