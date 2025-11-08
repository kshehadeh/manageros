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

      // Check if user already exists by email (for migration from NextAuth)
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      let createdOrUpdatedUserId: string

      await prisma.$transaction(async tx => {
        if (existingUser) {
          // User exists but doesn't have clerkUserId - link them
          if (!existingUser.clerkUserId) {
            await tx.user.update({
              where: { id: existingUser.id },
              data: { clerkUserId: id },
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

        // If there's a pending invitation, mark it as accepted
        if (pendingInvitation) {
          await tx.organizationInvitation.update({
            where: { id: pendingInvitation.id },
            data: {
              status: 'accepted',
              acceptedAt: new Date(),
            },
          })
        }

        console.log('Created or updated user ID:', createdOrUpdatedUserId)
      })

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

  return new Response('Webhook received', { status: 200 })
}
