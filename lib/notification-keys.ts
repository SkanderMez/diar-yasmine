/**
 * Notification preference keys. Shared by the Server Action (settings-actions.ts)
 * and the client components that surface the prefs in the UI.
 *
 * The full registry key is `notifications.${NotificationKey}`.
 *
 * Lives in its own module because Next.js forbids exporting non-async-function
 * values from a `"use server"` file.
 */
export const NOTIFICATION_KEYS = [
  "new_reservation",
  "cancellation",
  "conflict",
  "checkin_24h",
  "review_published",
  "monthly_report",
] as const;

export type NotificationKey = (typeof NOTIFICATION_KEYS)[number];
