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
            },
          })
          createdOrUpdatedUserId = newUser.id
        }

        // If there's a pending invitation, mark it as accepted
        if (pendingInvitation) {
          await tx.organizationInvitation.update({
            where: { id: pendingInvitation.id },
            data: {
              status: 'accepted',
              acceptedAt: new Date(),
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (pendingInvitation.organization as any).clerkOrgId
      ) {
        try {
          const { addUserToClerkOrganization, mapManagerOSRoleToClerkRole } =
            await import('@/lib/clerk-organization-utils')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const clerkOrgId = (pendingInvitation.organization as any).clerkOrgId
          if (clerkOrgId) {
            await addUserToClerkOrganization(
              clerkOrgId,
              id,
              await mapManagerOSRoleToClerkRole('USER')
            )
          }
        } catch (error) {
          console.error(
            'Failed to add user to Clerk organization in webhook:',
            error
          )
          // Don't fail the webhook - user is already in ManagerOS org
        }
      }

      // Sync user data to Clerk metadata (for JWT token inclusion)
      // Fetch user to construct UserBrief
      const userForSync = await prisma.user.findUnique({
        where: { clerkUserId: id },
        select: {
          id: true,
          email: true,
          name: true,
          clerkUserId: true,
          personId: true,
        },
      })
      if (userForSync) {
        const org = pendingInvitation
          ? await prisma.organization.findUnique({
              where: { id: pendingInvitation.organization.id },
              select: { clerkOrganizationId: true },
            })
          : null
        await syncUserDataToClerk({
          managerOSUserId: userForSync.id,
          email: userForSync.email,
          name: userForSync.name,
          clerkUserId: userForSync.clerkUserId || '',
          clerkOrganizationId: org?.clerkOrganizationId || null,
          managerOSOrganizationId: pendingInvitation?.organization.id || null,
          managerOSPersonId: userForSync.personId,
          role: 'user', // Default role, will be updated by Clerk session claims
        })
      }

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

      const updatedUser = await prisma.user.update({
        where: { clerkUserId: id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          clerkUserId: true,
          personId: true,
        },
      })

      // Sync updated user data to Clerk metadata
      if (updatedUser) {
        // Note: organization info would need to come from Clerk session claims
        await syncUserDataToClerk({
          managerOSUserId: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          clerkUserId: updatedUser.clerkUserId || '',
          clerkOrganizationId: null, // Will be set from Clerk session
          managerOSOrganizationId: null, // Will be set from Clerk session
          managerOSPersonId: updatedUser.personId,
          role: 'user', // Will be updated by Clerk session claims
        })
      }

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
    const { user_id, organization_id, plan_name, status } = evt.data as {
      user_id?: string
      organization_id?: string
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
        // Note: This is deprecated - subscriptions should have organization_id
        // We'll try to find organization by checking if user is in any Clerk org
        const user = await prisma.user.findUnique({
          where: { clerkUserId: user_id },
          select: { id: true, clerkUserId: true },
        })

        if (!user || !user.clerkUserId) {
          console.warn(
            `User not found for Clerk user ID ${user_id} in subscription webhook`
          )
          return new Response('User not found', { status: 404 })
        }

        // Try to find organization by checking Clerk memberships
        // This is a fallback - ideally webhooks should include organization_id
        console.warn(
          `Subscription webhook missing organization_id, using deprecated user-based lookup for user ${user_id}`
        )
        // We can't easily find the org without organization_id, so return error
        return new Response(
          'Organization ID required in subscription webhook',
          { status: 400 }
        )
      } else {
        return new Response(
          'Missing user_id or organization_id in subscription webhook',
          { status: 400 }
        )
      }

      // Subscription information is stored in Clerk, not in our database
      // Just verify the organization exists - no database update needed
      console.log(
        `Subscription updated in Clerk for organization ${organization.id}: plan=${plan_name}, status=${status}`
      )

      return new Response('Subscription webhook received', { status: 200 })
    } catch (error) {
      console.error('Error updating subscription:', error)
      return new Response('Error updating subscription', { status: 500 })
    }
  }

  // Organization membership webhooks are no longer needed since Clerk is the source of truth
  // Membership is managed directly through Clerk API calls

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
        // Note: This is deprecated - subscriptions should have organization_id
        console.warn(
          `Subscription cancellation webhook missing organization_id, using deprecated user-based lookup for user ${user_id}`
        )
        // We can't easily find the org without organization_id, so return error
        return new Response(
          'Organization ID required in subscription cancellation webhook',
          { status: 400 }
        )
      } else {
        return new Response(
          'Missing user_id or organization_id in subscription cancellation webhook',
          { status: 400 }
        )
      }

      // Subscription information is stored in Clerk, not in our database
      // Just verify the organization exists - no database update needed
      console.log(
        `Subscription canceled in Clerk for organization ${organization.id}`
      )

      return new Response('Subscription cancellation webhook received', {
        status: 200,
      })
    } catch (error) {
      console.error('Error canceling subscription:', error)
      return new Response('Error canceling subscription', { status: 500 })
    }
  }

  return new Response('Webhook received', { status: 200 })
}
