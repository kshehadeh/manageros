# Task Due Desktop Notifications

Task due reminders show a desktop notification when a task’s due time is within the reminder window you configured. Reminders are per user and per task.

## Setting a reminder

1. Open a task (create or edit) and set a **Due date**.
2. Choose **Reminder**: No reminder, 5 minutes before, 1 hour before, 1 day before, or **Custom** (enter minutes before due).
3. Save the task.

You can set or change the reminder in:

- **Task form** (create/edit) – reminder field appears when a due date is set.
- **Quick edit** – reminder dropdown when the task has a due date.
- **Task detail sidebar** – “Reminder” property (when due date is set and you can edit).

## When notifications appear

- **Web Push** (recommended): If the server has VAPID keys configured and you’ve allowed notifications, the app subscribes your browser to Web Push. A cron job runs every 5 minutes and sends push notifications for due reminders. Notifications can appear **even when the ManagerOS tab is in the background or closed**.
- **In-app poll**: The app also checks for due reminders about every 45 seconds while the tab is open. Notifications that were already sent via Web Push are not shown again in-app.
- The notification is shown at the configured time before the due date (e.g. “1 hour before” fires 1 hour before the due date/time).
- If you set “1 day before” but the task is due in a few hours, the reminder is effectively “due now” and can show as soon as the next check runs.

## After a notification

When you click the notification you are taken to the task page with a banner:

- **Acknowledge** – Dismisses the reminder for this due date. It will not show again for that task/due date.
- **Snooze** – Choose when to be reminded again: 5 minutes, 1 hour, 1 day, or a custom number of minutes. Only options that are before the task due time are offered (e.g. if the task is due in 3 hours, “1 day” is not available).

## Technical notes

- Reminder preference is stored in `TaskReminderPreference` (per task, per user).
- Delivery and state are stored in `TaskReminderDelivery` (when to show, push sent time, and whether it was acknowledged or snoozed).
- **Web Push**: A service worker (`/sw.js`) handles `push` and `notificationclick`. Subscriptions are stored in `PushSubscription` and sent to `POST /api/push-subscription`. The cron job `task-reminder-push` runs every 5 minutes and sends push for due reminders via the `web-push` library.
- APIs: `GET /api/task-reminders/due-now`, `GET /api/task-reminders/upcoming`, `POST /api/task-reminders/acknowledge`, `POST /api/task-reminders/snooze`, `POST /api/push-subscription`, `DELETE /api/push-subscription`.

## Server setup: Web Push (VAPID keys)

To enable Web Push so reminders can be sent when the tab is closed or in the background:

1. **Generate VAPID keys** (run once, e.g. in Node):

   ```js
   const webpush = require('web-push')
   const { publicKey, privateKey } = webpush.generateVAPIDKeys()
   console.log('VAPID_PUBLIC_KEY=', publicKey)
   console.log('VAPID_PRIVATE_KEY=', privateKey)
   ```

2. **Set environment variables**:
   - `VAPID_PUBLIC_KEY` – public key (server and client use this for sending / subscribing).
   - `VAPID_PRIVATE_KEY` – private key (server only, for signing push messages).
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` – same as `VAPID_PUBLIC_KEY` (so the browser can subscribe).
   - Optional: `VAPID_MAILTO` – contact for VAPID (e.g. `mailto:support@example.com`).

3. **Cron**: Ensure the notification cron runs the `task-reminder-push` job every 5 minutes (e.g. Vercel cron or your scheduler calling `/api/cron/notifications?job=task-reminder-push`).
