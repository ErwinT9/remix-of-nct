import { expect, test } from "vitest";
import { planReminders, type ReminderItem } from "@/lib/notifications/goalReminders";
import { dayKey, shiftDay } from "@/lib/goals";

const now = new Date();
now.setHours(8, 0, 0, 0);
const base = (o: Partial<ReminderItem>): ReminderItem => ({
  id: "1",
  title: "Walk",
  kind: "goal",
  start_date: dayKey(now),
  end_date: null,
  time_of_day: "morning",
  repeat_type: "daily",
  repeat_days: [],
  is_paused: false,
  reminder_enabled: true,
  reminder_time: "17:00",
  ...o,
});

test("off = nothing", () =>
  expect(planReminders([base({ reminder_enabled: false })], now)).toHaveLength(0));
test("daily gives 14", () => expect(planReminders([base({})], now)).toHaveLength(14));
test("end date respected", () =>
  expect(planReminders([base({ end_date: shiftDay(dayKey(now), 2) })], now)).toHaveLength(3));
test("one-off before start not fired", () =>
  expect(
    planReminders([base({ repeat_type: "none", start_date: shiftDay(dayKey(now), 3) })], now),
  ).toHaveLength(1));
test("grouping same time same day", () => {
  const p = planReminders([base({}), base({ id: "2", title: "Read" })], now);
  expect(p).toHaveLength(14);
  expect(p[0]!.body).toContain("Read");
  expect(p[0]!.title).toBe("2 reminders");
});
test("routine reminder is single", () => {
  const p = planReminders([base({ kind: "routine", title: "Morning Reset" })], now);
  expect(p[0]!.title).toBe("Routine reminder");
});
test("past time today skipped", () => {
  const p = planReminders([base({ reminder_time: "07:00" })], now);
  expect(p).toHaveLength(13);
});
test("paused skipped", () =>
  expect(planReminders([base({ is_paused: true })], now)).toHaveLength(0));
