/**
 * Task reminder constants and helpers for desktop notifications.
 * Used for reminder preference options and snooze options (filtered by time left until due).
 */

export const REMINDER_MINUTES = {
  NONE: null as number | null,
  FIVE_MIN: 5,
  ONE_HOUR: 60,
  ONE_DAY: 1440,
} as const

// Preset values for dropdown (excluding NONE which is "no reminder")
export const REMINDER_PRESET_MINUTES = [
  REMINDER_MINUTES.FIVE_MIN,
  REMINDER_MINUTES.ONE_HOUR,
  REMINDER_MINUTES.ONE_DAY,
] as const

export type ReminderPresetMinutes = (typeof REMINDER_PRESET_MINUTES)[number]

const PRESET_LABELS: Record<number, string> = {
  [REMINDER_MINUTES.FIVE_MIN]: '5 minutes before',
  [REMINDER_MINUTES.ONE_HOUR]: '1 hour before',
  [REMINDER_MINUTES.ONE_DAY]: '1 day before',
}

/**
 * Returns a human-readable label for reminder minutes (for presets only).
 * For custom values, use getReminderLabel.
 */
export function getReminderPresetLabel(minutes: number): string {
  return PRESET_LABELS[minutes] ?? `${minutes} minutes before`
}

/**
 * Returns a human-readable label for any reminder minutes value (preset or custom).
 */
export function getReminderLabel(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return 'No reminder'
  if (minutes === REMINDER_MINUTES.ONE_DAY) return '1 day before'
  if (minutes === REMINDER_MINUTES.ONE_HOUR) return '1 hour before'
  if (minutes === REMINDER_MINUTES.FIVE_MIN) return '5 minutes before'
  if (minutes < 60) return `${minutes} minutes before`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} before`
  const days = Math.floor(minutes / 1440)
  return `${days} day${days !== 1 ? 's' : ''} before`
}

/**
 * Options for the reminder dropdown: value (minutes or null) and label.
 */
export interface ReminderOption {
  value: number | null
  label: string
}

/**
 * All reminder options for the UI (no reminder + presets + custom placeholder).
 */
export function getReminderOptions(): ReminderOption[] {
  return [
    { value: null, label: 'No reminder' },
    {
      value: REMINDER_MINUTES.FIVE_MIN,
      label: getReminderPresetLabel(REMINDER_MINUTES.FIVE_MIN),
    },
    {
      value: REMINDER_MINUTES.ONE_HOUR,
      label: getReminderPresetLabel(REMINDER_MINUTES.ONE_HOUR),
    },
    {
      value: REMINDER_MINUTES.ONE_DAY,
      label: getReminderPresetLabel(REMINDER_MINUTES.ONE_DAY),
    },
  ]
}

/**
 * Snooze option: minutes from now and label.
 */
export interface SnoozeOption {
  minutes: number
  label: string
}

const SNOOZE_PRESET_MINUTES = [
  REMINDER_MINUTES.FIVE_MIN,
  REMINDER_MINUTES.ONE_HOUR,
  REMINDER_MINUTES.ONE_DAY,
] as const

/**
 * Returns snooze options that are valid given the time left until the task is due.
 * Only includes presets where (taskDueDate - now) >= preset minutes.
 * Options are ordered from shortest to longest.
 */
export function getSnoozeOptions(taskDueDate: Date): SnoozeOption[] {
  const now = new Date()
  const due = new Date(taskDueDate)
  if (due <= now) return []
  const minutesUntilDue = Math.floor(
    (due.getTime() - now.getTime()) / (60 * 1000)
  )
  const options: SnoozeOption[] = []
  for (const minutes of SNOOZE_PRESET_MINUTES) {
    if (minutes <= minutesUntilDue) {
      options.push({ minutes, label: getReminderPresetLabel(minutes) })
    }
  }
  return options
}

/**
 * Returns whether a custom snooze value (in minutes) is valid:
 * must be positive and <= (taskDueDate - now) in minutes.
 */
export function isValidSnoozeMinutes(
  snoozeMinutes: number,
  taskDueDate: Date
): boolean {
  if (snoozeMinutes <= 0) return false
  const now = new Date()
  const due = new Date(taskDueDate)
  if (due <= now) return false
  const minutesUntilDue = Math.floor(
    (due.getTime() - now.getTime()) / (60 * 1000)
  )
  return snoozeMinutes <= minutesUntilDue
}
