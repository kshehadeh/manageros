import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { checkPendingInvitation } from '@/lib/actions'
import { z } from 'zod'

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

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

    // Create user in a transaction
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
        : 'Account created successfully! You can now create or join an organization.',
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
