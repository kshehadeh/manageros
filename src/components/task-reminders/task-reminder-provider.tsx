'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const POLL_INTERVAL_MS = 45 * 1000
const DUE_NOW_API = '/api/task-reminders/due-now'
const SW_URL = '/sw.js'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Url = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Url)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

/**
 * TaskReminderProvider: registers for Web Push (when VAPID key is set) and polls for reminders due now.
 * Web Push delivers notifications even when the tab is in the background or closed.
 * In-app poll still runs for users who haven't subscribed to push.
 * On notification click, navigates to the task with ?reminder=deliveryId for acknowledge/snooze UI.
 */
export function TaskReminderProvider() {
  const router = useRouter()
  const shownRef = useRef<Set<string>>(new Set())
  const permissionRef = useRef<'default' | 'granted' | 'denied'>('default')
  const pushSubscribedRef = useRef(false)

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window))
      return false
    if (permissionRef.current !== 'default')
      return permissionRef.current === 'granted'
    try {
      const permission = await window.Notification.requestPermission()
      permissionRef.current = permission
      return permission === 'granted'
    } catch {
      return false
    }
  }, [])

  const subscribeToPush = useCallback(async () => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      pushSubscribedRef.current
    )
      return
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidPublicKey) return
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const registration =
        reg ?? (await navigator.serviceWorker.register(SW_URL, { scope: '/' }))
      await registration.update()
      const sub = await registration.pushManager.getSubscription()
      if (sub) {
        pushSubscribedRef.current = true
        await fetch('/api/push-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        })
        return
      }
      const keyBytes = urlBase64ToUint8Array(vapidPublicKey)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes.buffer.slice(0) as ArrayBuffer,
      })
      const res = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })
      if (res.ok) pushSubscribedRef.current = true
    } catch (err) {
      console.error('Push subscription failed:', err)
    }
  }, [])

  const checkAndShowReminders = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (permissionRef.current !== 'granted') return

    try {
      const res = await fetch(DUE_NOW_API)
      if (!res.ok) return
      const data = await res.json()
      const reminders = data?.reminders ?? []
      for (const r of reminders) {
        if (!r.id || !r.taskId || shownRef.current.has(r.id)) continue
        shownRef.current.add(r.id)
        const dueLabel = r.taskDueDate
          ? new Date(r.taskDueDate).toLocaleString(undefined, {
              dateStyle: 'short',
              timeStyle: 'short',
            })
          : 'soon'
        const notification = new Notification(r.taskTitle ?? 'Task due', {
          body: `Due ${dueLabel}. Click to open.`,
          tag: r.id,
          data: { deliveryId: r.id, taskId: r.taskId },
        })
        notification.onclick = () => {
          window.focus()
          router.push(`/tasks/${r.taskId}?reminder=${r.id}`)
          notification.close()
        }
      }
    } catch (err) {
      console.error('Task reminders due-now check failed:', err)
    }
  }, [router])

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (window.Notification.permission === 'granted') {
      permissionRef.current = 'granted'
    } else {
      permissionRef.current = window.Notification.permission as
        | 'default'
        | 'denied'
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register(SW_URL, { scope: '/' }).catch(err => {
      console.error('Service worker registration failed:', err)
    })
  }, [])

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null

    const run = async () => {
      if (permissionRef.current !== 'granted') {
        const ok = await requestPermission()
        if (!ok) return
        await subscribeToPush()
      }
      await checkAndShowReminders()
    }

    run()
    intervalId = setInterval(run, POLL_INTERVAL_MS)
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [requestPermission, subscribeToPush, checkAndShowReminders])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.Notification.permission === 'granted') {
      subscribeToPush()
    }
  }, [subscribeToPush])

  return null
}
