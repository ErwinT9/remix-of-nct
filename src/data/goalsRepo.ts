import { supabase } from "@/integrations/supabase/client";

import { localDayKey } from "./repository";

export type Routine = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  icon: string;
  time_category: string;
  is_starter: boolean;
  sort_order: number;
};

export type Goal = {
  id: string;
  user_id: string;
  routine_id: string | null;
  title: string;
  description: string | null;
  category: string;
  is_custom: boolean;
  sort_order: number;
};

export type GoalCompletion = {
  id: string;
  goal_id: string;
  completion_date: string;
  completed: boolean;
};

export type GoalsSnapshot = {
  routines: Routine[];
  goals: Goal[];
  /** Today's completion rows, keyed by goal id. */
  completions: Record<string, boolean>;
  date: string;
};

export type GoalInput = {
  title: string;
  description?: string | null;
  category?: string;
  routine_id?: string | null;
  is_custom?: boolean;
};

export type RoutineInput = {
  title: string;
  description?: string | null;
  icon?: string;
  time_category?: string;
  is_starter?: boolean;
};

export const goalsRepo = {
  async load(userId: string): Promise<GoalsSnapshot> {
    const date = localDayKey();
    const [routines, goals, completions] = await Promise.all([
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
        .from("goal_completions")
        .select("goal_id, completed")
        .eq("user_id", userId)
        .eq("completion_date", date),
    ]);
    if (routines.error) throw routines.error;
    if (goals.error) throw goals.error;
    if (completions.error) throw completions.error;

    const map: Record<string, boolean> = {};
    for (const row of completions.data ?? []) map[row.goal_id] = row.completed;

    return {
      routines: (routines.data ?? []) as Routine[],
      goals: (goals.data ?? []) as Goal[],
      completions: map,
      date,
    };
  },

  async addGoal(userId: string, input: GoalInput, sortOrder = 0): Promise<void> {
    const { error } = await supabase.from("goals").insert({
      user_id: userId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      category: input.category ?? "other",
      routine_id: input.routine_id ?? null,
      is_custom: input.is_custom ?? true,
      sort_order: sortOrder,
    });
    if (error) throw error;
  },

  async addGoals(userId: string, inputs: GoalInput[], startOrder = 0): Promise<void> {
    if (inputs.length === 0) return;
    const { error } = await supabase.from("goals").insert(
      inputs.map((input, index) => ({
        user_id: userId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        category: input.category ?? "other",
        routine_id: input.routine_id ?? null,
        is_custom: input.is_custom ?? true,
        sort_order: startOrder + index,
      })),
    );
    if (error) throw error;
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
      })
      .select("id")
      .single();
    if (error) throw error;
    const routineId = data.id as string;
    await goalsRepo.addGoals(
      userId,
      goals.map((goal) => ({ ...goal, routine_id: routineId })),
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
      })
      .eq("id", routineId);
    if (error) throw error;
  },

  async deleteRoutine(routineId: string): Promise<void> {
    const { error } = await supabase.from("routines").delete().eq("id", routineId);
    if (error) throw error;
  },

  /** Upsert one completion row per goal per local calendar day. */
  async setCompleted(userId: string, goalId: string, completed: boolean): Promise<void> {
    const date = localDayKey();
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
