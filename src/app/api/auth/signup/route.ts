import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organizationName: z.string().min(1, 'Organization name is required'),
  organizationSlug: z.string()
    .min(1, 'Organization slug is required')
    .regex(/^[a-z0-9-]+$/, 'Organization slug can only contain lowercase letters, numbers, and hyphens')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    // Check if organization slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: validatedData.organizationSlug }
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization slug already exists' },
        { status: 400 }
      )
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12)

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: validatedData.organizationName,
          slug: validatedData.organizationSlug
        }
      })

      // Create user as admin of the organization
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          passwordHash,
          role: 'ADMIN',
          organizationId: organization.id
        },
        include: {
          organization: true
        }
      })

      return { user, organization }
    })

    return NextResponse.json({
      message: 'Account created successfully',
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        organization: result.organization
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
