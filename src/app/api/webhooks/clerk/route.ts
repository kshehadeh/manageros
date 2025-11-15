/* eslint-disable camelcase */
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { checkPendingInvitation } from '@/lib/actions/organization'
import { syncUserDataToClerk } from '@/lib/clerk-session-sync'

export async function POST(req: Request) {
  // Get the Svix headers for verification
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data

    if (!id || !email_addresses || email_addresses.length === 0) {
      return new Response('Missing required user data', { status: 400 })
    }

    const email = email_addresses[0].email_address
    const name =
      first_name && last_name
        ? `${first_name} ${last_name}`
        : first_name || last_name || email.split('@')[0]

    try {
      // Check for pending invitation
      const pendingInvitation = await checkPendingInvitation(email)

      // Check if user already exists by clerkUserId (handles on-the-fly creation)
      let existingUser = await prisma.user.findUnique({
        where: { clerkUserId: id },
      })

      // If not found by clerkUserId, check by email (for migration from NextAuth)
      if (!existingUser) {
        existingUser = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        })
      }

      let createdOrUpdatedUserId: string

      await prisma.$transaction(async tx => {
        if (existingUser) {
          // User exists - update if needed
          if (!existingUser.clerkUserId) {
            // Link clerkUserId if missing
            await tx.user.update({
              where: { id: existingUser.id },
              data: { clerkUserId: id },
            })
          }
          // Update email and name if they've changed
          if (
            existingUser.email !== email.toLowerCase() ||
            existingUser.name !== name
          ) {
            await tx.user.update({
              where: { id: existingUser.id },
              data: {
                email: email.toLowerCase(),
                name,
              },
            })
          }
          createdOrUpdatedUserId = existingUser.id
        } else {
          // Create new user
          const newUser = await tx.user.create({
            data: {
              email: email.toLowerCase(),
              name,
              clerkUserId: id,
              role: 'USER',
              organizationId: pendingInvitation?.organization.id || null,
            },
          })
          createdOrUpdatedUserId = newUser.id
        }

        // If there's a pending invitation, mark it as accepted and create OrganizationMember
        if (pendingInvitation) {
          await tx.organizationInvitation.update({
            where: { id: pendingInvitation.id },
            data: {
              status: 'accepted',
              acceptedAt: new Date(),
            },
          })

          // Create OrganizationMember record
          await tx.organizationMember.upsert({
            where: {
              userId_organizationId: {
                userId: createdOrUpdatedUserId,
                organizationId: pendingInvitation.organization.id,
              },
            },
            create: {
              userId: createdOrUpdatedUserId,
              organizationId: pendingInvitation.organization.id,
              role: 'USER',
            },
            update: {
              role: 'USER', // Ensure role is USER for invited users
            },
          })

          // Get organization with Clerk org ID
          const org = await tx.organization.findUnique({
            where: { id: pendingInvitation.organization.id },
            select: {
              id: true,
              clerkOrganizationId: true,
            },
          })

          // Store org info for adding to Clerk org after transaction
          if (org) {
            // We'll add the user to Clerk org after the transaction completes
            // Store this info temporarily
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(pendingInvitation.organization as any).clerkOrgId =
              org.clerkOrganizationId
          }
        }

        console.log('Created or updated user ID:', createdOrUpdatedUserId)
      })

      // Add user to Clerk organization if they were invited
       
      if (
        pendingInvitation &&
        (pendingInvitation.organization as any).clerkOrgId
      ) {
        try {
          const {
            ensureClerkOrganization,
            addUserToClerkOrganization,
            mapManagerOSRoleToClerkRole,
          } = await import('@/lib/clerk-organization-utils')
          const clerkOrgId =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (pendingInvitation.organization as any).clerkOrgId ||
            (await ensureClerkOrganization(pendingInvitation.organization.id))
          await addUserToClerkOrganization(
            clerkOrgId,
            id,
            await mapManagerOSRoleToClerkRole('USER')
          )
        } catch (error) {
          console.error(
            'Failed to add user to Clerk organization in webhook:',
            error
          )
          // Don't fail the webhook - user is already in ManagerOS org
        }
      }

      // Sync user data to Clerk metadata (for JWT token inclusion)
      await syncUserDataToClerk(id)

      return new Response('User created/linked successfully', { status: 200 })
    } catch (error) {
      console.error('Error creating/linking user:', error)
      return new Response('Error creating/linking user', { status: 500 })
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data

    if (!id) {
      return new Response('Missing user ID', { status: 400 })
    }

    const email = email_addresses?.[0]?.email_address
    const name =
      first_name && last_name
        ? `${first_name} ${last_name}`
        : first_name || last_name

    try {
      // Update user in database
      const updateData: {
        name?: string
        email?: string
      } = {}

      if (name) {
        updateData.name = name
      }

      if (email) {
        updateData.email = email.toLowerCase()
      }

      await prisma.user.update({
        where: { clerkUserId: id },
        data: updateData,
      })

      // Sync updated user data to Clerk metadata
      await syncUserDataToClerk(id)

      return new Response('User updated successfully', { status: 200 })
    } catch (error) {
      console.error('Error updating user:', error)
      return new Response('Error updating user', { status: 500 })
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    if (!id) {
      return new Response('Missing user ID', { status: 400 })
    }

    try {
      // Delete user from database (or mark as deleted)
      // For now, we'll delete the user record
      await prisma.user.delete({
        where: { clerkUserId: id },
      })

      return new Response('User deleted successfully', { status: 200 })
    } catch (error) {
      console.error('Error deleting user:', error)
      // User might not exist, which is fine
      return new Response('User deleted', { status: 200 })
    }
  }

  // Handle subscription webhooks
  if (
    eventType === 'subscription.created' ||
    eventType === 'subscription.updated'
  ) {
    const { user_id, organization_id, plan_id, plan_name, status } =
      evt.data as {
        user_id?: string
        organization_id?: string
        plan_id?: string
        plan_name?: string
        status?: string
      }

    try {
      let organization = null

      // Priority 1: If organization_id is present, this is an organization subscription
      if (organization_id) {
        organization = await prisma.organization.findUnique({
          where: { clerkOrganizationId: organization_id },
        })

        if (!organization) {
          console.warn(
            `No organization found with clerkOrganizationId ${organization_id} for subscription webhook`
          )
          return new Response('Organization not found', { status: 404 })
        }
      } else if (user_id) {
        // Priority 2: Fallback to user-based lookup (for backward compatibility)
        const user = await prisma.user.findUnique({
          where: { clerkUserId: user_id },
        })

        if (!user) {
          console.warn(
            `User not found for Clerk user ID ${user_id} in subscription webhook`
          )
          return new Response('User not found', { status: 404 })
        }

        // Find organization where this user is the billing user
        organization = await prisma.organization.findFirst({
          where: { billingUserId: user.id },
        })

        if (!organization) {
          console.warn(
            `No organization found with billingUserId ${user.id} for subscription webhook`
          )
          return new Response('Organization not found', { status: 404 })
        }
      } else {
        return new Response(
          'Missing user_id or organization_id in subscription webhook',
          { status: 400 }
        )
      }

      // Update organization subscription information
      await prisma.organization.update({
        where: { id: organization.id },
        data: {
          subscriptionPlanId: plan_id || null,
          subscriptionPlanName: plan_name || null,
          subscriptionStatus: status || 'active',
        },
      })

      return new Response('Subscription updated successfully', { status: 200 })
    } catch (error) {
      console.error('Error updating subscription:', error)
      return new Response('Error updating subscription', { status: 500 })
    }
  }

  // Handle organization membership webhooks
  if (eventType === 'organizationMembership.created') {
    const { organization_id, public_user_data } = evt.data as {
      id?: string
      organization_id?: string
      public_user_data?: {
        user_id?: string
      }
    }

    if (!organization_id || !public_user_data?.user_id) {
      return new Response(
        'Missing organization_id or user_id in organizationMembership.created webhook',
        { status: 400 }
      )
    }

    try {
      // Find the organization by Clerk org ID
      const organization = await prisma.organization.findUnique({
        where: { clerkOrganizationId: organization_id },
      })

      if (!organization) {
        console.warn(
          `Organization not found for Clerk org ID ${organization_id} in membership webhook`
        )
        return new Response('Organization not found', { status: 404 })
      }

      // Find the user by Clerk user ID
      const user = await prisma.user.findUnique({
        where: { clerkUserId: public_user_data.user_id },
      })

      if (!user) {
        console.warn(
          `User not found for Clerk user ID ${public_user_data.user_id} in membership webhook`
        )
        return new Response('User not found', { status: 404 })
      }

      // Check if user is already a member (shouldn't happen, but handle gracefully)
      const existingMembership = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: organization.id,
          },
        },
      })

      if (!existingMembership) {
        // Create OrganizationMember record
        await prisma.organizationMember.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            role: 'USER', // Default role for webhook-created memberships
          },
        })

        // Update user's organizationId if not set
        if (!user.organizationId) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              organizationId: organization.id,
              role: 'USER',
            },
          })
        }
      }

      return new Response('Organization membership created successfully', {
        status: 200,
      })
    } catch (error) {
      console.error('Error creating organization membership:', error)
      return new Response('Error creating organization membership', {
        status: 500,
      })
    }
  }

  if (eventType === 'organizationMembership.deleted') {
    const { organization_id, public_user_data } = evt.data as {
      organization_id?: string
      public_user_data?: {
        user_id?: string
      }
    }

    if (!organization_id || !public_user_data?.user_id) {
      return new Response(
        'Missing organization_id or user_id in organizationMembership.deleted webhook',
        { status: 400 }
      )
    }

    try {
      // Find the organization by Clerk org ID
      const organization = await prisma.organization.findUnique({
        where: { clerkOrganizationId: organization_id },
      })

      if (!organization) {
        console.warn(
          `Organization not found for Clerk org ID ${organization_id} in membership deletion webhook`
        )
        return new Response('Organization not found', { status: 404 })
      }

      // Find the user by Clerk user ID
      const user = await prisma.user.findUnique({
        where: { clerkUserId: public_user_data.user_id },
      })

      if (!user) {
        console.warn(
          `User not found for Clerk user ID ${public_user_data.user_id} in membership deletion webhook`
        )
        return new Response('User not found', { status: 404 })
      }

      // Remove OrganizationMember record
      await prisma.organizationMember.deleteMany({
        where: {
          userId: user.id,
          organizationId: organization.id,
        },
      })

      // Clear user's organizationId if it matches this organization
      if (user.organizationId === organization.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            organizationId: null,
            role: 'USER',
          },
        })
      }

      return new Response('Organization membership deleted successfully', {
        status: 200,
      })
    } catch (error) {
      console.error('Error deleting organization membership:', error)
      return new Response('Error deleting organization membership', {
        status: 500,
      })
    }
  }

  if (eventType === 'subscriptionItem.canceled') {
    const { user_id, organization_id } = evt.data as {
      user_id?: string
      organization_id?: string
    }

    try {
      let organization = null

      // Priority 1: If organization_id is present, this is an organization subscription
      if (organization_id) {
        organization = await prisma.organization.findUnique({
          where: { clerkOrganizationId: organization_id },
        })

        if (!organization) {
          console.warn(
            `No organization found with clerkOrganizationId ${organization_id} for subscription cancellation webhook`
          )
          return new Response('Organization not found', { status: 404 })
        }
      } else if (user_id) {
        // Priority 2: Fallback to user-based lookup (for backward compatibility)
        const user = await prisma.user.findUnique({
          where: { clerkUserId: user_id },
        })

        if (!user) {
          console.warn(
            `User not found for Clerk user ID ${user_id} in subscription cancellation webhook`
          )
          return new Response('User not found', { status: 404 })
        }

        // Find organization where this user is the billing user
        organization = await prisma.organization.findFirst({
          where: { billingUserId: user.id },
        })

        if (!organization) {
          console.warn(
            `No organization found with billingUserId ${user.id} for subscription cancellation webhook`
          )
          return new Response('Organization not found', { status: 404 })
        }
      } else {
        return new Response(
          'Missing user_id or organization_id in subscription cancellation webhook',
          { status: 400 }
        )
      }

      // Update organization subscription status to canceled
      await prisma.organization.update({
        where: { id: organization.id },
        data: {
          subscriptionStatus: 'canceled',
        },
      })

      return new Response('Subscription canceled successfully', { status: 200 })
    } catch (error) {
      console.error('Error canceling subscription:', error)
      return new Response('Error canceling subscription', { status: 500 })
    }
  }

  return new Response('Webhook received', { status: 200 })
}
