import { z } from 'zod'

const teamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Team name must be less than 100 characters'),
  description: z.string().optional(),
  parentId: z.string().optional().transform(val => val === '' ? undefined : val),
})

async function testValidation() {
  try {
    console.log('Testing validation schema...')
    
    // Test with empty string parentId
    const result1 = teamSchema.parse({
      name: 'Test Team',
      description: 'Test description',
      parentId: ''
    })
    
    console.log('✓ Empty string parentId transformed to:', result1.parentId)
    
    // Test with undefined parentId
    const result2 = teamSchema.parse({
      name: 'Test Team',
      description: 'Test description',
      parentId: undefined
    })
    
    console.log('✓ Undefined parentId remains:', result2.parentId)
    
    // Test with valid parentId
    const result3 = teamSchema.parse({
      name: 'Test Team',
      description: 'Test description',
      parentId: 'valid-uuid-here'
    })
    
    console.log('✓ Valid parentId remains:', result3.parentId)
    
    console.log('🎉 All validation tests passed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testValidation().catch(console.error)
