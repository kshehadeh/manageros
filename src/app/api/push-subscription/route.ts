import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'

/**
 * POST /api/push-subscription
 * Body: { subscription: { endpoint: string, keys: { auth: string, p256dh: string } } }
 * Saves or updates the current user's Web Push subscription for task reminders.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser({ request })
    if (!user.managerOSUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const sub = body?.subscription
    if (
      !sub ||
      typeof sub.endpoint !== 'string' ||
      !sub.keys ||
      typeof sub.keys.auth !== 'string' ||
      typeof sub.keys.p256dh !== 'string'
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid subscription: endpoint and keys.auth, keys.p256dh required',
        },
        { status: 400 }
      )
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: {
        userId: user.managerOSUserId,
        endpoint: sub.endpoint,
        auth: sub.keys.auth,
        p256dh: sub.keys.p256dh,
      },
      update: {
        userId: user.managerOSUserId,
        auth: sub.keys.auth,
        p256dh: sub.keys.p256dh,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/push-subscription:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/push-subscription
 * Body: { endpoint: string } or no body to remove all for current user.
 * Removes the Web Push subscription(s) for the current user.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser({ request })
    if (!user.managerOSUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const endpoint = body?.endpoint

    if (typeof endpoint === 'string') {
      await prisma.pushSubscription.deleteMany({
        where: {
          endpoint,
          userId: user.managerOSUserId,
        },
      })
    } else {
      await prisma.pushSubscription.deleteMany({
        where: { userId: user.managerOSUserId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/push-subscription:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
