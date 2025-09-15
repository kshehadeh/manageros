import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { checkPendingInvitation } from '@/lib/actions'
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

    // Check for pending invitation
    const pendingInvitation = await checkPendingInvitation(validatedData.email)

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async tx => {
      let organization = null
      let userRole = 'USER'

      // If user has a pending invitation, accept it and join that organization
      if (pendingInvitation) {
        organization = await tx.organization.findUnique({
          where: { id: pendingInvitation.organization.id },
        })
        userRole = 'USER' // Invited users are regular users, not admins

        // Mark invitation as accepted
        await tx.organizationInvitation.update({
          where: { id: pendingInvitation.id },
          data: {
            status: 'accepted',
            acceptedAt: new Date(),
          },
        })
      } else if (
        validatedData.organizationName &&
        validatedData.organizationSlug
      ) {
        // Create organization if provided and no invitation
        organization = await tx.organization.create({
          data: {
            name: validatedData.organizationName,
            slug: validatedData.organizationSlug,
          },
        })
        userRole = 'ADMIN' // User creating org becomes admin
      }

      // Create user
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          passwordHash,
          role: userRole,
          organizationId: organization?.id || null,
        },
        include: {
          organization: true,
        },
      })

      return { user, organization, wasInvited: !!pendingInvitation }
    })

    return NextResponse.json({
      message: result.wasInvited
        ? 'Account created successfully and you have been added to the organization!'
        : 'Account created successfully',
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        organization: result.organization,
      },
      wasInvited: result.wasInvited,
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
