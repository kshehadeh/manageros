# Notifications API (Removed)

The in-app Notifications API was removed in February 2026. The notification bell, notifications page, and related REST endpoints (`/api/notifications`, `/api/notifications/list`, `/api/notifications/live`, `/api/notifications/count`) are no longer available.

Tolerance rules still create **exceptions** when thresholds are exceeded; those are viewable and manageable on the Exceptions page. Feedback campaign **email** tracking (invite/reminder sends) continues to use `NotificationRecord` for logging only and is not part of the removed in-app notification system.
