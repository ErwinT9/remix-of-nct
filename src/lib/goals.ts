import {
  Coffee,
  Flower2,
  Heart,
  Leaf,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  type LucideIcon,
} from "lucide-react";

export type GoalCategory = "no-contact" | "emotional" | "self-care" | "growth" | "other";
export type RoutineTimeCategory = "morning" | "afternoon" | "evening" | "night" | "anytime";

export const GOAL_CATEGORIES: { id: GoalCategory; label: string; tint: string }[] = [
  { id: "no-contact", label: "No Contact", tint: "bg-lavender" },
  { id: "emotional", label: "Emotional Recovery", tint: "bg-sky" },
  { id: "self-care", label: "Self-Care", tint: "bg-mint" },
  { id: "growth", label: "Personal Growth", tint: "bg-sand" },
  { id: "other", label: "Other", tint: "bg-blush" },
];

export function categoryLabel(id: string): string {
  return GOAL_CATEGORIES.find((item) => item.id === id)?.label ?? "Other";
}

export const TIME_CATEGORIES: { id: RoutineTimeCategory; label: string }[] = [
  { id: "morning", label: "🌅 Morning" },
  { id: "afternoon", label: "☀️ Afternoon" },
  { id: "evening", label: "🌆 Evening" },
  { id: "night", label: "🌙 Night" },
  { id: "anytime", label: "⏱️ Anytime" },
];

export function timeOfDayLabel(id: string | null | undefined): string {
  return TIME_CATEGORIES.find((item) => item.id === id)?.label ?? "⏱️ Anytime";
}

export const ROUTINE_ICONS: { id: string; icon: LucideIcon }[] = [
  { id: "sunrise", icon: Sunrise },
  { id: "sun", icon: Sun },
  { id: "sunset", icon: Sunset },
  { id: "moon", icon: Moon },
  { id: "shield", icon: Shield },
  { id: "heart", icon: Heart },
  { id: "leaf", icon: Leaf },
  { id: "flower", icon: Flower2 },
  { id: "sparkles", icon: Sparkles },
  { id: "coffee", icon: Coffee },
];

export function routineIcon(id: string | null | undefined): LucideIcon {
  return ROUTINE_ICONS.find((item) => item.id === id)?.icon ?? Sunrise;
}

/* ------------------------------------------------------------------ */
/* Scheduling                                                          */
/* ------------------------------------------------------------------ */

export type RepeatType = "none" | "daily" | "weekdays" | "weekly" | "monthly";

export const REPEAT_OPTIONS: { id: RepeatType; label: string }[] = [
  { id: "none", label: "Does not repeat" },
  { id: "daily", label: "Every day" },
  { id: "weekdays", label: "Every weekday" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type Schedule = {
  start_date: string;
  end_date: string | null;
  time_of_day: string;
  repeat_type: string;
  repeat_days: number[];
  is_paused: boolean;
};

const pad = (value: number) => String(value).padStart(2, "0");

/** "YYYY-MM-DD" for a local calendar day. */
export function dayKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parse "YYYY-MM-DD" into a local (midday, DST-safe) Date. */
export function parseDayKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0);
}

export function shiftDay(value: string, days: number): string {
  const date = parseDayKey(value);
  date.setDate(date.getDate() + days);
  return dayKey(date);
}

/** "Today", "Tomorrow", "Yesterday" or "Fri, 28 Aug". */
export function friendlyDay(value: string): string {
  const today = dayKey();
  if (value === today) return "Today";
  if (value === shiftDay(today, 1)) return "Tomorrow";
  if (value === shiftDay(today, -1)) return "Yesterday";
  return parseDayKey(value).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function longDay(value: string): string {
  return parseDayKey(value).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Whether a scheduled goal/routine is active on the given local calendar day. */
export function isActiveOn(schedule: Schedule, date: string): boolean {
  if (schedule.is_paused) return false;
  if (date < schedule.start_date) return false;
  if (schedule.end_date && date > schedule.end_date) return false;

  const target = parseDayKey(date);
  const start = parseDayKey(schedule.start_date);

  switch (schedule.repeat_type as RepeatType) {
    case "none":
      return date === schedule.start_date;
    case "daily":
      return true;
    case "weekdays": {
      const dow = target.getDay();
      return dow >= 1 && dow <= 5;
    }
    case "weekly": {
      const days = schedule.repeat_days?.length ? schedule.repeat_days : [start.getDay()];
      return days.includes(target.getDay());
    }
    case "monthly":
      return target.getDate() === start.getDate();
    default:
      return true;
  }
}

/** Short human summary such as "Every day" or "Aug 30". */
export function scheduleLabel(schedule: Schedule): string {
  const repeat = schedule.repeat_type as RepeatType;
  if (repeat === "daily") return "Every day";
  if (repeat === "weekdays") return "Weekdays";
  if (repeat === "monthly") return "Monthly";
  if (repeat === "weekly") {
    const days = schedule.repeat_days?.length
      ? schedule.repeat_days
      : [parseDayKey(schedule.start_date).getDay()];
    return `Every ${days
      .slice()
      .sort((a, b) => a - b)
      .map((day) => WEEKDAY_LABELS[day])
      .join(", ")}`;
  }
  return friendlyDay(schedule.start_date);
}

export type SuggestedGoal = { title: string; description?: string; category: GoalCategory };

export const SUGGESTED_GOALS: { category: GoalCategory; label: string; goals: SuggestedGoal[] }[] = [
  {
    category: "no-contact",
    label: "No Contact",
    goals: [
      { title: "Maintain no contact today", category: "no-contact" },
      { title: "Don't check their social media", category: "no-contact" },
      { title: "Don't reread old messages", category: "no-contact" },
      { title: "Don't check their online status", category: "no-contact" },
    ],
  },
  {
    category: "emotional",
    label: "Emotional Recovery",
    goals: [
      { title: "Complete today's mood check-in", category: "emotional" },
      { title: "Read today's motivation", category: "emotional" },
      { title: "Practice breathing for 5 minutes", category: "emotional" },
      { title: "Write down one thing I'm grateful for", category: "emotional" },
    ],
  },
  {
    category: "self-care",
    label: "Self-Care",
    goals: [
      { title: "Exercise for 20 minutes", category: "self-care" },
      { title: "Spend time outdoors", category: "self-care" },
      { title: "Drink enough water", category: "self-care" },
      { title: "Get enough rest", category: "self-care" },
    ],
  },
  {
    category: "growth",
    label: "Personal Growth",
    goals: [
      { title: "Work on a personal goal", category: "growth" },
      { title: "Learn something new", category: "growth" },
      { title: "Spend time on a hobby", category: "growth" },
      { title: "Connect with a friend or family member", category: "growth" },
    ],
  },
];

export type StarterRoutine = {
  title: string;
  description: string;
  icon: string;
  time_category: RoutineTimeCategory;
  goals: SuggestedGoal[];
};

export const STARTER_ROUTINES: StarterRoutine[] = [
  {
    title: "Morning Reset",
    description: "Start your day focused on yourself and your healing.",
    icon: "sunrise",
    time_category: "morning",
    goals: [
      { title: "Don't check their social media", category: "no-contact" },
      { title: "Read today's motivation", category: "emotional" },
      { title: "Take 5 deep breaths", category: "emotional" },
      { title: "Set today's intention", category: "growth" },
    ],
  },
  {
    title: "Afternoon Reset",
    description: "Take a mindful pause in the middle of your day.",
    icon: "sun",
    time_category: "afternoon",
    goals: [
      { title: "Take a short break for yourself", category: "self-care" },
      { title: "Drink water", category: "self-care" },
      { title: "Focus on work or a personal task", category: "growth" },
      { title: "Avoid checking your ex's social media", category: "no-contact" },
    ],
  },
  {
    title: "Evening Reset",
    description: "End your day peacefully and reflect on your progress.",
    icon: "sunset",
    time_category: "evening",
    goals: [
      { title: "Complete today's mood check-in", category: "emotional" },
      { title: "Write a daily reflection", category: "emotional" },
      { title: "Record one personal win", category: "growth" },
      { title: "Spend time away from social media", category: "no-contact" },
    ],
  },
  {
    title: "Night Reset",
    description: "Wind down gently and prepare for better rest.",
    icon: "moon",
    time_category: "night",
    goals: [
      { title: "Avoid rereading old messages", category: "no-contact" },
      { title: "Reflect on today's progress", category: "emotional" },
      { title: "Practice calm breathing", category: "emotional" },
      { title: "Prepare for tomorrow", category: "growth" },
      { title: "Get enough rest", category: "self-care" },
    ],
  },
  {
    title: "No Contact Protection",
    description: "Stay focused and protect your progress today.",
    icon: "shield",
    time_category: "anytime",
    goals: [
      { title: "Maintain no contact today", category: "no-contact" },
      { title: "Don't check their online status", category: "no-contact" },
      { title: "Don't reread old conversations", category: "no-contact" },
      { title: "Avoid asking friends about them", category: "no-contact" },
      { title: "Focus on one activity for yourself", category: "self-care" },
    ],
  },
  {
    title: "Self-Care Routine",
    description: "Small acts of care that rebuild your energy.",
    icon: "leaf",
    time_category: "anytime",
    goals: [
      { title: "Exercise", category: "self-care" },
      { title: "Drink enough water", category: "self-care" },
      { title: "Spend time outdoors", category: "self-care" },
      { title: "Do something enjoyable", category: "self-care" },
      { title: "Practice self-care", category: "self-care" },
    ],
  },
];

/** Goals that map onto an existing app feature, so tapping them can offer a shortcut. */
const LINKS: { match: RegExp; to: string; label: string }[] = [
  { match: /mood check-?in/i, to: "/check-in", label: "Open Mood Check-In" },
  { match: /personal win|record one win/i, to: "/wins", label: "Open Wins" },
  { match: /motivation/i, to: "/motivation/guide", label: "Open Motivational Guide" },
  { match: /breath|deep breaths/i, to: "/motivation/meditation", label: "Open Mindful Meditation" },
  { match: /grateful|gratitude/i, to: "/motivation/gratitude-jar", label: "Open Gratitude Jar" },
  { match: /reflection|journal/i, to: "/journal", label: "Open Journal" },
  { match: /outdoors|walk/i, to: "/motivation/walk", label: "Open Outdoor Walk" },
];

export function goalShortcut(title: string): { to: string; label: string } | null {
  return LINKS.find((link) => link.match.test(title)) ?? null;
}
