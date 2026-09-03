import type { JourneyProgress } from "@/data/types";

export const JOURNEY_LEVEL_1 = "level-1";
export const JOURNEY_LEVEL_2 = "level-2";
export const JOURNEY_LEVEL_3 = "level-3";
export const JOURNEY_LEVEL_4 = "level-4";

export type JourneyActivityId =
  | "l1-feelings"
  | "l1-breathing"
  | "l1-grounding"
  | "l1-meditation"
  | "l1-reflection"
  | "l2-journal"
  | "l2-prepare-rest"
  | "l2-let-go"
  | "l2-affirmation"
  | "l2-sleep-routine"
  | "l3-who-am-i"
  | "l3-strengths"
  | "l3-just-for-you"
  | "l3-confidence"
  | "l3-self-portrait"
  | "l4-one-good-thing"
  | "l4-worthy-moment"
  | "l4-appreciate"
  | "l4-gratitude-practice"
  | "l4-good-things-list";


export type JourneyActivityDef = {
  id: JourneyActivityId;
  title: string;
  description: string;
  /** Unique calendar days of practice required before it can be completed. */
  requiredDays: number;
};

export const LEVEL_1 = {
  id: JOURNEY_LEVEL_1,
  title: "Level 1: Find Your Calm",
  description:
    "Your first steps toward finding calm. Take time to understand your emotions, slow down your thoughts, and create space for peace.",
  objective:
    "Understand and manage stress, anxiety, and overwhelming emotions after a breakup.",
  activities: [
    {
      id: "l1-feelings",
      title: "Understand Your Feelings",
      description:
        "Take a moment to check in with yourself and better understand what you are feeling right now.",
      requiredDays: 1,
    },
    {
      id: "l1-breathing",
      title: "2-Minute Breathing Exercise",
      description: "Slow down, focus on your breathing, and give your mind a moment of calm.",
      requiredDays: 2,
    },
    {
      id: "l1-grounding",
      title: "Ground Yourself",
      description:
        "When your thoughts feel overwhelming, bring your attention back to the present moment.",
      requiredDays: 1,
    },
    {
      id: "l1-meditation",
      title: "Mindful Meditation",
      description:
        "Take a few quiet minutes to slow down, relax, and create space for calmness and clarity.",
      requiredDays: 4,
    },
    {
      id: "l1-reflection",
      title: "Calm Reflection",
      description:
        "Take a quiet moment to reflect on what helped you feel calmer and what you want to carry forward.",
      requiredDays: 1,
    },
  ] satisfies JourneyActivityDef[],
} as const;

export const LEVEL_2 = {
  id: JOURNEY_LEVEL_2,
  title: "Level 2: Rest & Recharge",
  description:
    "Give your mind space to slow down, release the weight of the day, and build small habits that support better rest.",
  objective:
    "Slow down, release stressful thoughts, build positive self-talk, and develop healthier habits for better rest.",
  activities: [
    {
      id: "l2-journal",
      title: "Daily Journal",
      description: "Take a few moments to reflect on your day, thoughts, and feelings.",
      requiredDays: 2,
    },
    {
      id: "l2-prepare-rest",
      title: "Prepare Your Mind for Rest",
      description:
        "Create a gentle transition between your busy day and a more peaceful state of rest.",
      requiredDays: 1,
    },
    {
      id: "l2-let-go",
      title: "Let Go of Today's Thoughts",
      description:
        "Put down the thoughts still following you from today and give your mind permission to rest.",
      requiredDays: 1,
    },
    {
      id: "l2-affirmation",
      title: "Write an Affirmation",
      description:
        "Create a supportive message for yourself and return to it over several different days.",
      requiredDays: 4,
    },
    {
      id: "l2-sleep-routine",
      title: "Build Your Sleep Routine",
      description:
        "Create a simple and realistic routine that helps your mind and body prepare for better rest.",
      requiredDays: 1,
    },
  ] satisfies JourneyActivityDef[],
} as const;

export const LEVEL_3 = {
  id: JOURNEY_LEVEL_3,
  title: "Level 3: Rediscover Yourself",
  description:
    "Reconnect with who you are outside the relationship — your qualities, your strengths, and the person you are becoming.",
  objective:
    "Develop self-acceptance, confidence, and a clear sense of your own identity.",
  activities: [
    {
      id: "l3-who-am-i",
      title: "Who Am I Beyond the Relationship?",
      description:
        "Reflect on your personality, values, interests, strengths, and the qualities that make you uniquely you.",
      requiredDays: 1,
    },
    {
      id: "l3-strengths",
      title: "See Your Strengths",
      description:
        "Name the qualities you appreciate about yourself, over two different days.",
      requiredDays: 2,
    },
    {
      id: "l3-just-for-you",
      title: "Do Something Just for You",
      description:
        "Choose and complete a small thing you genuinely enjoy, without seeking anyone else's approval.",
      requiredDays: 1,
    },
    {
      id: "l3-confidence",
      title: "Build Your Confidence",
      description:
        "Each day, complete one small action that makes you feel capable, independent, or proud.",
      requiredDays: 4,
    },
    {
      id: "l3-self-portrait",
      title: "My New Self-Portrait",
      description:
        "Write about the person you are becoming — your qualities, values, boundaries, and dreams.",
      requiredDays: 1,
    },
  ] satisfies JourneyActivityDef[],
} as const;

export const LEVEL_4 = {
  id: JOURNEY_LEVEL_4,
  title: "Level 4: Notice the Good",
  description:
    "Shift your attention toward gratitude, positive moments, and the good things that still exist in everyday life.",
  objective:
    "Build the habit of noticing gratitude, positive moments, and the good that remains in daily life.",
  activities: [
    {
      id: "l4-one-good-thing",
      title: "Find One Good Thing",
      description: "Notice and record one positive thing from your day, no matter how small.",
      requiredDays: 1,
    },
    {
      id: "l4-worthy-moment",
      title: "A Moment Worth Remembering",
      description: "Write about good or meaningful moments that make you smile, over two different days.",
      requiredDays: 2,
    },
    {
      id: "l4-appreciate",
      title: "Appreciate What You Have",
      description:
        "Reflect on the people, places, experiences, abilities, and simple things you appreciate right now.",
      requiredDays: 1,
    },
    {
      id: "l4-gratitude-practice",
      title: "Gratitude in Practice",
      description: "Record at least one thing you're grateful for, on four different days.",
      requiredDays: 4,
    },
    {
      id: "l4-good-things-list",
      title: "My Good Things List",
      description:
        "Create a personal list of the things that bring meaning, comfort, happiness, or hope into your life.",
      requiredDays: 1,
    },
  ] satisfies JourneyActivityDef[],
} as const;

export type JourneyLevelDef = {
  id: string;
  title: string;
  description: string;
  objective: string;
  activities: readonly JourneyActivityDef[];
};

export const LEVELS: readonly JourneyLevelDef[] = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4];

export type ActivityState = "completed" | "available" | "locked";
export type LevelState = "completed" | "in_progress" | "available" | "locked";



export function progressByActivity(rows: JourneyProgress[]) {
  const map = new Map<string, JourneyProgress>();
  rows.forEach((row) => map.set(row.activity_id, row));
  return map;
}

/**
 * Sequential unlocking inside a level: the first activity is always available,
 * every other one unlocks once the activity directly before it is completed.
 */
export function activityState(
  level: JourneyLevelDef,
  index: number,
  rows: JourneyProgress[],
): ActivityState {
  const map = progressByActivity(rows);
  const self = map.get(level.activities[index]!.id);
  if (self?.completed) return "completed";
  if (index === 0) return "available";
  const previous = map.get(level.activities[index - 1]!.id);
  return previous?.completed ? "available" : "locked";
}

export function completedCount(level: JourneyLevelDef, rows: JourneyProgress[]): number {
  return level.activities.filter((activity) =>
    rows.some((row) => row.activity_id === activity.id && row.completed),
  ).length;
}

export function isLevelComplete(level: JourneyLevelDef, rows: JourneyProgress[]): boolean {
  return completedCount(level, rows) === level.activities.length;
}

/** A level unlocks only once every activity of the previous level is completed. */
export function levelState(
  index: number,
  rows: JourneyProgress[],
): LevelState {
  const level = LEVELS[index]!;
  const done = completedCount(level, rows);
  if (done === level.activities.length) return "completed";
  const previous = LEVELS[index - 1];
  const unlocked = index === 0 || (previous ? isLevelComplete(previous, rows) : false);
  if (!unlocked) return "locked";
  return done > 0 ? "in_progress" : "available";
}

/** Unique practice days already recorded for a multi-day activity. */
export function daysDone(rows: JourneyProgress[], activityId: string): string[] {
  return rows.find((row) => row.activity_id === activityId)?.day_dates ?? [];
}
