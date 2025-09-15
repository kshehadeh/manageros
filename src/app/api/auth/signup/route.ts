import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    organizationName: z.string().optional(),
    organizationSlug: z
      .string()
      .regex(
        /^[a-z0-9-]+$/,
        'Organization slug can only contain lowercase letters, numbers, and hyphens'
      )
      .optional(),
  })
  .refine(
    data => {
      // If organizationName is provided, organizationSlug must also be provided
      if (data.organizationName && !data.organizationSlug) {
        return false
      }
      if (data.organizationSlug && !data.organizationName) {
        return false
      }
      return true
    },
    {
      message: 'Both organization name and slug must be provided together',
      path: ['organizationSlug'],
    }
  )

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    // Check if organization slug already exists (only if provided)
    if (validatedData.organizationSlug) {
      const existingOrg = await prisma.organization.findUnique({
        where: { slug: validatedData.organizationSlug },
      })

      if (existingOrg) {
        return NextResponse.json(
          { error: 'Organization slug already exists' },
          { status: 400 }
        )
      }
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12)

    // Create organization and user in a transaction (if organization provided)
    const result = await prisma.$transaction(async tx => {
      let organization = null

      // Create organization if provided
      if (validatedData.organizationName && validatedData.organizationSlug) {
        organization = await tx.organization.create({
          data: {
            name: validatedData.organizationName,
            slug: validatedData.organizationSlug,
          },
        })
      }

      // Create user
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          passwordHash,
          role: organization ? 'ADMIN' : 'USER', // Admin if creating org, User otherwise
          organizationId: organization?.id || null,
        },
        include: {
          organization: true,
        },
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
        organization: result.organization,
      },
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
