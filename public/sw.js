/**
 * Service worker for Web Push task reminders.
 * Listens for push events and notificationclick to open the task with ?reminder=.
 */

self.addEventListener('push', function (event) {
  if (!event.data) return
  let payload
  try {
    payload = event.data.json()
  } catch {
    return
  }
  if (payload.type !== 'task-reminder' || !payload.deliveryId || !payload.taskId) return

  const title = payload.taskTitle || 'Task due'
  const dueDate = payload.taskDueDate
    ? new Date(payload.taskDueDate).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'soon'
  const body = 'Due ' + dueDate + '. Click to open.'

  const options = {
    body,
    tag: payload.deliveryId,
    data: {
      deliveryId: payload.deliveryId,
      taskId: payload.taskId,
    },
    requireInteraction: false,
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const data = event.notification.data || {}
  const taskId = data.taskId
  const deliveryId = data.deliveryId
  if (!taskId) return

  const url = new URL(self.location.origin)
  url.pathname = '/tasks/' + encodeURIComponent(taskId)
  if (deliveryId) {
    url.searchParams.set('reminder', deliveryId)
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(url.href)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url.href)
      }
    })
  )
})
