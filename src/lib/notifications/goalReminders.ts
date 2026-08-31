import {
  dayKey,
  isActiveOn,
  minutesOfTime,
  parseDayKey,
  upcomingActiveDates,
  type Schedule,
} from "@/lib/goals";
import { isNative, safeNative } from "@/lib/native/platform";

/**
 * Local reminders for Goals & Routines.
 *
 * These are entirely separate from the 30-day support notifications: they live
 * on their own channel and use a reserved id range so a re-sync only ever
 * cancels reminders it owns. Every sync rebuilds the next two weeks from
 * scratch, which keeps edits, disables and deletes duplicate-free.
 */

const CHANNEL_ID = "goal-reminders";
const ID_BASE = 500_000;
const ID_MAX = 599_999;
const HORIZON_DAYS = 14;

export type ReminderItem = Schedule & {
  id: string;
  title: string;
  kind: "goal" | "routine";
  reminder_enabled: boolean;
  reminder_time: string | null;
};

async function localPlugin() {
  const mod = await import("@capacitor/local-notifications");
  return mod.LocalNotifications;
}

function supportiveBody(titles: string[], kind: "goal" | "routine"): string {
  if (titles.length === 1) {
    return kind === "routine"
      ? `Time for “${titles[0]}”. A few gentle minutes for yourself.`
      : `A gentle nudge for “${titles[0]}”. Whenever you're ready.`;
  }
  const shown = titles.slice(0, 3).join(", ");
  const rest = titles.length - Math.min(titles.length, 3);
  return rest > 0
    ? `${shown} and ${rest} more — take them one at a time.`
    : `${shown} — take them one at a time.`;
}

type Plan = { id: number; at: Date; title: string; body: string };

/** Builds the notification plan for the next two weeks. Pure + testable. */
export function planReminders(items: ReminderItem[], now: Date = new Date()): Plan[] {
  const active = items.filter(
    (item) => item.reminder_enabled && item.reminder_time && !item.is_paused,
  );
  if (active.length === 0) return [];

  const today = dayKey(now);
  // date -> time -> items
  const buckets = new Map<string, Map<string, ReminderItem[]>>();

  for (const item of active) {
    for (const date of upcomingActiveDates(item, HORIZON_DAYS)) {
      if (!isActiveOn(item, date)) continue;
      const time = item.reminder_time as string;
      const byTime = buckets.get(date) ?? new Map<string, ReminderItem[]>();
      byTime.set(time, [...(byTime.get(time) ?? []), item]);
      buckets.set(date, byTime);
    }
  }

  const plans: Plan[] = [];
  for (const [date, byTime] of buckets) {
    const offset = Math.round(
      (parseDayKey(date).getTime() - parseDayKey(today).getTime()) / 86_400_000,
    );
    for (const [time, group] of byTime) {
      const minutes = minutesOfTime(time);
      const at = parseDayKey(date);
      at.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      if (at.getTime() <= now.getTime()) continue;

      const routines = group.filter((item) => item.kind === "routine");
      // A routine reminder speaks for the routine; goals inside it only fire
      // when they carry their own reminder, so nothing is duplicated here.
      const titles = group.map((item) => item.title);
      const kind: "goal" | "routine" = routines.length === group.length ? "routine" : "goal";
      const title =
        group.length === 1
          ? group[0]?.kind === "routine"
            ? "Routine reminder"
            : "Goal reminder"
          : `${group.length} reminders`;

      plans.push({
        id: ID_BASE + offset * 1440 + minutes,
        at,
        title,
        body: supportiveBody(titles, kind),
      });
    }
  }
  return plans.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** Cancels every reminder we own, then schedules the fresh plan. */
export async function syncGoalReminders(items: ReminderItem[]): Promise<void> {
  if (!isNative()) return;
  await safeNative(async () => {
    const LocalNotifications = await localPlugin();

    const pending = await LocalNotifications.getPending();
    const ours = pending.notifications.filter((n) => n.id >= ID_BASE && n.id <= ID_MAX);
    if (ours.length > 0) await LocalNotifications.cancel({ notifications: ours });

    const plans = planReminders(items);
    if (plans.length === 0) return;

    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== "granted") return;

    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: "Goal & routine reminders",
      description: "Gentle reminders for the goals and routines you scheduled",
      importance: 4,
      visibility: 1,
    });

    await LocalNotifications.schedule({
      notifications: plans.map((plan) => ({
        id: plan.id,
        channelId: CHANNEL_ID,
        title: plan.title,
        body: plan.body,
        schedule: { at: plan.at, allowWhileIdle: true },
        extra: { deep_link: "/motivation/journey" },
      })),
    });
  });
}

/** Removes all goal/routine reminders (e.g. on sign-out). */
export async function clearGoalReminders(): Promise<void> {
  await syncGoalReminders([]);
}
