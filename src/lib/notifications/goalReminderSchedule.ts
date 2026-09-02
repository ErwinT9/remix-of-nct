import { isActiveOn } from "@/lib/goals";

import { localNow, minutesOf } from "./schedule";

/**
 * Server-side planning for Goal & Routine reminders.
 *
 * These share the existing push pipeline (push-scheduler hook →
 * send-push-notification) and the notification_history duplicate guard, but
 * live in their own notification_id range so the 30-day cycle (ids < 1000)
 * is never touched.
 */

export const GOAL_REMINDER_ID_BASE = 1_000_000;
export const GOAL_REMINDER_ID_SPAN = 1_000_000;

/** Stable numeric notification id derived from a goal/routine uuid (FNV-1a). */
export function goalReminderNotificationId(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return GOAL_REMINDER_ID_BASE + (hash % GOAL_REMINDER_ID_SPAN);
}

export type ReminderRow = {
  id: string;
  title: string;
  kind: "goal" | "routine";
  start_date: string;
  end_date: string | null;
  repeat_type: string;
  repeat_days: number[] | null;
  is_paused: boolean;
  reminder_enabled: boolean;
  reminder_time: string | null;
  reminder_timezone: string | null;
};

export type DueReminder = { row: ReminderRow; localDate: string; time: string };

/**
 * Reminders whose local send time has just passed. `windowMinutes` matches the
 * 5-minute cron cadence with slack; duplicates are prevented by the unique
 * (user_id, notification_id, local_date) row in notification_history.
 */
export function dueGoalReminders(
  rows: ReminderRow[],
  fallbackTimezone: string,
  now: Date = new Date(),
  windowMinutes = 10,
): DueReminder[] {
  const due: DueReminder[] = [];
  for (const row of rows) {
    if (!row.reminder_enabled || !row.reminder_time || row.is_paused) continue;
    const timezone = row.reminder_timezone || fallbackTimezone;
    const local = localNow(timezone, now);
    if (!local) continue;
    const diff = local.minutes - minutesOf(row.reminder_time);
    if (diff < 0 || diff >= windowMinutes) continue;
    if (
      !isActiveOn(
        {
          start_date: row.start_date,
          end_date: row.end_date,
          time_of_day: "anytime",
          repeat_type: row.repeat_type,
          repeat_days: row.repeat_days ?? [],
          is_paused: row.is_paused,
        },
        local.date,
      )
    )
      continue;
    due.push({ row, localDate: local.date, time: row.reminder_time });
  }
  return due;
}

export function reminderBody(row: ReminderRow): string {
  return row.kind === "routine"
    ? `Time for “${row.title}”. A few gentle minutes for yourself.`
    : `A gentle nudge for “${row.title}”. Whenever you're ready.`;
}
