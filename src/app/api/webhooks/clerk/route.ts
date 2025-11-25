/* eslint-disable camelcase */
import { verifyWebhook } from '@clerk/backend/webhooks'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const evt = await verifyWebhook(req)

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'organization.created') {
    const { id, name } = evt.data

    if (!id) {
      return new Response('Missing organization ID', { status: 400 })
    }

    // Ensure organization exists in database
    await prisma.organization.upsert({
      where: { clerkOrganizationId: id },
      update: {
        description: name, // Using description for name as per schema usage
      },
      create: {
        clerkOrganizationId: id,
        description: name,
      },
    })

    return new Response('Organization created/updated', { status: 200 })
  }

  if (eventType === 'organization.deleted') {
    const { id } = evt.data

    if (!id) {
      return new Response('Missing organization ID', { status: 400 })
    }

    // Delete organization from database
    try {
      await prisma.organization.delete({
        where: { clerkOrganizationId: id },
      })
    } catch (error) {
      console.error('Error deleting organization:', error)
      // If it fails (e.g. not found), we can consider it "handled" or return 500.
      // If not found, it's already deleted.
      // We'll log and return 200 to acknowledge receipt.
    }

    return new Response('Organization deleted', { status: 200 })
  }

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

    // Check if user exists by Clerk ID
    const existingUserByClerkId = await prisma.user.findUnique({
      where: { clerkUserId: id },
    })

    if (existingUserByClerkId) {
      await prisma.user.update({
        where: { id: existingUserByClerkId.id },
        data: {
          email: email.toLowerCase(),
          name,
        },
      })
    } else {
      // Check by email to link existing accounts
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (existingUserByEmail) {
        await prisma.user.update({
          where: { id: existingUserByEmail.id },
          data: {
            clerkUserId: id,
            name,
          },
        })
      } else {
        await prisma.user.create({
          data: {
            clerkUserId: id,
            email: email.toLowerCase(),
            name,
          },
        })
      }
    }

    return new Response('User created/updated', { status: 200 })
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    if (!id) {
      return new Response('Missing user ID', { status: 400 })
    }

    // Delete user from database
    try {
      await prisma.user.delete({
        where: { clerkUserId: id },
      })
    } catch (error) {
      console.error('Error deleting user:', error)
    }

    return new Response('User deleted', { status: 200 })
  }

  return new Response('Webhook received but unhandled', { status: 200 })
}
