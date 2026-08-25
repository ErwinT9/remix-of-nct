import { supabase } from "@/integrations/supabase/client";
import { dayKey } from "@/lib/goals";

export type ScheduleFields = {
  start_date: string;
  end_date: string | null;
  time_of_day: string;
  repeat_type: string;
  repeat_days: number[];
  is_paused: boolean;
};

export type Routine = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  icon: string;
  time_category: string;
  is_starter: boolean;
  sort_order: number;
} & ScheduleFields;

export type Goal = {
  id: string;
  user_id: string;
  routine_id: string | null;
  title: string;
  description: string | null;
  category: string;
  is_custom: boolean;
  sort_order: number;
} & ScheduleFields;

export type RoutineGoalLink = {
  id: string;
  routine_id: string;
  goal_id: string;
  sort_order: number;
};

export type GoalsSnapshot = {
  routines: Routine[];
  goals: Goal[];
  links: RoutineGoalLink[];
  /** Completion rows for the selected date, keyed by goal id. */
  completions: Record<string, boolean>;
  date: string;
};

export type ScheduleInput = Partial<ScheduleFields>;

export type GoalInput = {
  title: string;
  description?: string | null;
  category?: string;
  routine_id?: string | null;
  is_custom?: boolean;
} & ScheduleInput;

export type RoutineInput = {
  title: string;
  description?: string | null;
  icon?: string;
  time_category?: string;
  is_starter?: boolean;
} & ScheduleInput;

function scheduleColumns(input: ScheduleInput) {
  return {
    start_date: input.start_date ?? dayKey(),
    end_date: input.end_date ?? null,
    time_of_day: input.time_of_day ?? "anytime",
    repeat_type: input.repeat_type ?? "daily",
    repeat_days: input.repeat_days ?? [],
    is_paused: input.is_paused ?? false,
  };
}

function schedulePatch(input: ScheduleInput) {
  return {
    ...(input.start_date !== undefined ? { start_date: input.start_date } : {}),
    ...(input.end_date !== undefined ? { end_date: input.end_date } : {}),
    ...(input.time_of_day !== undefined ? { time_of_day: input.time_of_day } : {}),
    ...(input.repeat_type !== undefined ? { repeat_type: input.repeat_type } : {}),
    ...(input.repeat_days !== undefined ? { repeat_days: input.repeat_days } : {}),
    ...(input.is_paused !== undefined ? { is_paused: input.is_paused } : {}),
  };
}

export const goalsRepo = {
  async load(userId: string, date: string = dayKey()): Promise<GoalsSnapshot> {
    const [routines, goals, links, completions] = await Promise.all([
      supabase
        .from("routines")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("routine_goals")
        .select("id, routine_id, goal_id, sort_order")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("goal_completions")
        .select("goal_id, completed")
        .eq("user_id", userId)
        .eq("completion_date", date),
    ]);
    if (routines.error) throw routines.error;
    if (goals.error) throw goals.error;
    if (links.error) throw links.error;
    if (completions.error) throw completions.error;

    const map: Record<string, boolean> = {};
    for (const row of completions.data ?? []) map[row.goal_id] = row.completed;

    return {
      routines: (routines.data ?? []) as Routine[],
      goals: (goals.data ?? []) as Goal[],
      links: (links.data ?? []) as RoutineGoalLink[],
      completions: map,
      date,
    };
  },

  /** Insert goals; when routineId is given they are also linked to that routine. */
  async addGoals(
    userId: string,
    inputs: GoalInput[],
    startOrder = 0,
    routineId: string | null = null,
  ): Promise<string[]> {
    if (inputs.length === 0) return [];
    const { data, error } = await supabase
      .from("goals")
      .insert(
        inputs.map((input, index) => ({
          user_id: userId,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          category: input.category ?? "other",
          routine_id: routineId ?? input.routine_id ?? null,
          is_custom: input.is_custom ?? true,
          sort_order: startOrder + index,
          ...scheduleColumns(input),
        })),
      )
      .select("id");
    if (error) throw error;
    const ids = (data ?? []).map((row) => row.id as string);
    if (routineId) await goalsRepo.linkGoals(userId, routineId, ids, startOrder);
    return ids;
  },

  async addGoal(userId: string, input: GoalInput, sortOrder = 0): Promise<void> {
    await goalsRepo.addGoals(userId, [input], sortOrder, input.routine_id ?? null);
  },

  /** Attach existing goals to a routine without duplicating the goal rows. */
  async linkGoals(
    userId: string,
    routineId: string,
    goalIds: string[],
    startOrder = 0,
  ): Promise<void> {
    if (goalIds.length === 0) return;
    const { error } = await supabase.from("routine_goals").upsert(
      goalIds.map((goalId, index) => ({
        user_id: userId,
        routine_id: routineId,
        goal_id: goalId,
        sort_order: startOrder + index,
      })),
      { onConflict: "routine_id,goal_id" },
    );
    if (error) throw error;
  },

  /** Remove a goal from a routine, keeping the goal itself. */
  async unlinkGoal(routineId: string, goalId: string): Promise<void> {
    const { error } = await supabase
      .from("routine_goals")
      .delete()
      .eq("routine_id", routineId)
      .eq("goal_id", goalId);
    if (error) throw error;
    await supabase.from("goals").update({ routine_id: null }).eq("id", goalId);
  },

  async updateGoal(goalId: string, patch: Partial<GoalInput>): Promise<void> {
    const { error } = await supabase
      .from("goals")
      .update({
        ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
        ...(patch.description !== undefined
          ? { description: patch.description?.trim() || null }
          : {}),
        ...(patch.category !== undefined ? { category: patch.category } : {}),
        ...schedulePatch(patch),
      })
      .eq("id", goalId);
    if (error) throw error;
  },

  async deleteGoal(goalId: string): Promise<void> {
    const { error } = await supabase.from("goals").delete().eq("id", goalId);
    if (error) throw error;
  },

  async addRoutine(userId: string, input: RoutineInput, goals: GoalInput[]): Promise<string> {
    const { data, error } = await supabase
      .from("routines")
      .insert({
        user_id: userId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        icon: input.icon ?? "sunrise",
        time_category: input.time_category ?? "anytime",
        is_starter: input.is_starter ?? false,
        ...scheduleColumns(input),
      })
      .select("id")
      .single();
    if (error) throw error;
    const routineId = data.id as string;
    const schedule: ScheduleInput = {
      start_date: input.start_date ?? dayKey(),
      end_date: input.end_date ?? null,
      time_of_day: input.time_of_day ?? input.time_category ?? "anytime",
      repeat_type: input.repeat_type ?? "daily",
      repeat_days: input.repeat_days ?? [],
    };
    await goalsRepo.addGoals(
      userId,
      goals.map((goal) => ({ ...schedule, ...goal })),
      0,
      routineId,
    );
    return routineId;
  },

  async updateRoutine(routineId: string, patch: Partial<RoutineInput>): Promise<void> {
    const { error } = await supabase
      .from("routines")
      .update({
        ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
        ...(patch.description !== undefined
          ? { description: patch.description?.trim() || null }
          : {}),
        ...(patch.icon !== undefined ? { icon: patch.icon } : {}),
        ...(patch.time_category !== undefined ? { time_category: patch.time_category } : {}),
        ...schedulePatch(patch),
      })
      .eq("id", routineId);
    if (error) throw error;
  },

  async deleteRoutine(routineId: string): Promise<void> {
    const { error } = await supabase.from("routines").delete().eq("id", routineId);
    if (error) throw error;
  },

  /** Upsert one completion row per goal per local calendar day. */
  async setCompleted(
    userId: string,
    goalId: string,
    completed: boolean,
    date: string = dayKey(),
  ): Promise<void> {
    const { error } = await supabase.from("goal_completions").upsert(
      {
        user_id: userId,
        goal_id: goalId,
        completion_date: date,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,goal_id,completion_date" },
    );
    if (error) throw error;
  },
};
