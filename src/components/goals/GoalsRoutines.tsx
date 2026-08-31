import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  Sprout,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";

import { SoftCard } from "@/components/SoftCard";
import { AddGoalSheet } from "@/components/goals/AddGoalSheet";
import { RoutineSheet } from "@/components/goals/RoutineSheet";
import {
  ScheduleFields,
  defaultSchedule,
  type ScheduleValue,
} from "@/components/goals/ScheduleFields";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { goalsRepo, type Goal, type GoalInput, type Routine } from "@/data/goalsRepo";
import { useAuth } from "@/hooks/useAuth";
import {
  categoryLabel,
  dayKey,
  formatTime12,
  friendlyDay,
  goalShortcut,
  isActiveOn,
  routineIcon,
  scheduleLabel,
  shiftDay,
  timeOfDayLabel,
  type RepeatType,
} from "@/lib/goals";
import { haptic } from "@/lib/native/haptics";
import { requestNotificationPermissionStatus } from "@/lib/notifications";
import { syncGoalReminders, type ReminderItem } from "@/lib/notifications/goalReminders";
import { cn } from "@/lib/utils";

function GoalRow({
  goal,
  done,
  shared,
  onToggle,
  onEdit,
  onDelete,
  onRemoveFromRoutine,
}: {
  goal: Goal;
  done: boolean;
  shared?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRemoveFromRoutine?: () => void;
}) {
  const shortcut = goalShortcut(goal.title);
  return (
    <li className="flex items-start gap-3 py-2.5">
      <button
        type="button"
        aria-label={done ? `Mark ${goal.title} as not done` : `Mark ${goal.title} as done`}
        aria-pressed={done}
        onClick={onToggle}
        className={cn(
          "press mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
          done ? "border-primary bg-primary" : "border-muted-foreground/40",
        )}
      >
        {done ? <Check className="size-4 text-primary-foreground" aria-hidden /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm leading-snug",
            done && "text-muted-foreground line-through decoration-muted-foreground/50",
          )}
        >
          {goal.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {scheduleLabel(goal)} · {timeOfDayLabel(goal.time_of_day)}
          {shared ? " · also in a routine" : ""}
        </p>
        {goal.reminder_enabled && goal.reminder_time ? (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-primary">
            <Bell className="size-3" aria-hidden /> {formatTime12(goal.reminder_time)}
          </p>
        ) : null}
        {goal.description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{goal.description}</p>
        ) : null}
        {shortcut && !done ? (
          <Link
            to={shortcut.to}
            className="mt-1 inline-block text-xs font-medium text-primary underline-offset-2"
          >
            {shortcut.label}
          </Link>
        ) : null}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Options for ${goal.title}`}
          className="press -mr-1 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground"
        >
          <MoreVertical className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>Edit goal</DropdownMenuItem>
          {onRemoveFromRoutine ? (
            <DropdownMenuItem onClick={onRemoveFromRoutine}>Remove from routine</DropdownMenuItem>
          ) : null}
          <DropdownMenuItem className="text-destructive" onClick={onDelete}>
            Delete goal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

export function GoalsRoutines() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => dayKey());
  const queryKey = ["goals-routines", userId, date];

  const [addGoalFor, setAddGoalFor] = useState<{ routine: Routine | null } | null>(null);
  const [routineSheet, setRoutineSheet] = useState<{ routine: Routine | null } | null>(null);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSchedule, setEditSchedule] = useState<ScheduleValue>(() => defaultSchedule());
  const [deleteRoutine, setDeleteRoutine] = useState<Routine | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);

  const snapshot = useQuery({
    queryKey,
    queryFn: () => goalsRepo.load(userId, date),
    enabled: Boolean(userId),
  });

  const data = snapshot.data;
  const routines = data?.routines ?? [];
  const goals = data?.goals ?? [];
  const links = data?.links ?? [];
  const completions = data?.completions ?? {};

  const goalById = new Map(goals.map((goal) => [goal.id, goal]));
  const linkedGoalIds = new Set(links.map((link) => link.goal_id));
  const goalsForRoutine = (routineId: string) =>
    links
      .filter((link) => link.routine_id === routineId)
      .map((link) => goalById.get(link.goal_id))
      .filter((goal): goal is Goal => Boolean(goal));

  const standalone = goals.filter((goal) => !goal.routine_id);
  const standaloneToday = standalone.filter((goal) => isActiveOn(goal, date));
  const activeRoutines = routines.filter((routine) => isActiveOn(routine, date));

  // Unique goal ids scheduled for the selected date (shared goals count once).
  const activeIds = new Set(standaloneToday.map((goal) => goal.id));
  for (const routine of activeRoutines) {
    for (const goal of goalsForRoutine(routine.id)) {
      if (isActiveOn(goal, date)) activeIds.add(goal.id);
    }
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["goals-routines", userId] });

  const toggle = useMutation({
    mutationFn: ({ goalId, completed }: { goalId: string; completed: boolean }) =>
      goalsRepo.setCompleted(userId, goalId, completed, date),
    onMutate: async ({ goalId, completed }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: typeof data) =>
        old ? { ...old, completions: { ...old.completions, [goalId]: completed } } : old,
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => void refresh(),
  });

  const addGoals = useMutation({
    mutationFn: async ({
      inputs,
      routineId,
    }: {
      inputs: GoalInput[];
      routineId: string | null;
    }) => {
      const base = routineId ? goalsForRoutine(routineId).length : standalone.length;
      await goalsRepo.addGoals(userId, inputs, base, routineId);
    },
    onSuccess: () => void refresh(),
  });

  const linkGoals = useMutation({
    mutationFn: async ({ routineId, goalIds }: { routineId: string; goalIds: string[] }) =>
      goalsRepo.linkGoals(userId, routineId, goalIds, goalsForRoutine(routineId).length),
    onSuccess: () => void refresh(),
  });

  const unlinkGoal = useMutation({
    mutationFn: ({ routineId, goalId }: { routineId: string; goalId: string }) =>
      goalsRepo.unlinkGoal(routineId, goalId),
    onSuccess: () => void refresh(),
  });

  const saveGoal = useMutation({
    mutationFn: ({ goalId, patch }: { goalId: string; patch: Partial<GoalInput> }) =>
      goalsRepo.updateGoal(goalId, patch),
    onSuccess: () => void refresh(),
  });

  const removeGoal = useMutation({
    mutationFn: (goalId: string) => goalsRepo.deleteGoal(goalId),
    onSuccess: () => void refresh(),
  });

  const saveRoutine = useMutation({
    mutationFn: async ({
      routine,
      input,
      starterGoals,
    }: {
      routine: Routine | null;
      input: Parameters<typeof goalsRepo.addRoutine>[1];
      starterGoals: GoalInput[];
    }) => {
      if (routine) return goalsRepo.updateRoutine(routine.id, input);
      const id = await goalsRepo.addRoutine(userId, input, starterGoals);
      setExpanded((list) => [...list, id]);
    },
    onSuccess: () => void refresh(),
  });

  const removeRoutine = useMutation({
    mutationFn: (routineId: string) => goalsRepo.deleteRoutine(routineId),
    onSuccess: () => void refresh(),
  });

  const totalToday = activeIds.size;
  const doneToday = [...activeIds].filter((id) => completions[id]).length;
  const percent = totalToday === 0 ? 0 : Math.round((doneToday / totalToday) * 100);
  const allDone = totalToday > 0 && doneToday === totalToday;
  const isEmpty = goals.length === 0 && routines.length === 0;
  const isToday = date === dayKey();

  // Rebuild local reminders whenever goals or routines change. This cancels the
  // previous plan first, so edits, disables and deletes never leave duplicates.
  const reminderSignature = JSON.stringify(
    [...routines, ...goals].map((item) => [
      item.id,
      item.title,
      item.reminder_enabled,
      item.reminder_time,
      item.start_date,
      item.end_date,
      item.repeat_type,
      item.repeat_days,
      item.is_paused,
    ]),
  );

  useEffect(() => {
    const items: ReminderItem[] = [
      ...routines.map((routine) => ({ ...routine, kind: "routine" as const })),
      ...goals.map((goal) => ({ ...goal, kind: "goal" as const })),
    ];
    const needsPermission = items.some((item) => item.reminder_enabled && item.reminder_time);
    void (async () => {
      if (needsPermission) await requestNotificationPermissionStatus();
      await syncGoalReminders(items);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminderSignature]);

  const goalCard = (goal: Goal, routine?: Routine) => (
    <GoalRow
      key={`${routine?.id ?? "solo"}-${goal.id}`}
      goal={goal}
      done={Boolean(completions[goal.id])}
      shared={!routine && linkedGoalIds.has(goal.id)}
      onToggle={() => {
        haptic.light();
        toggle.mutate({ goalId: goal.id, completed: !completions[goal.id] });
      }}
      onEdit={() => {
        setEditGoal(goal);
        setEditTitle(goal.title);
        setEditDescription(goal.description ?? "");
        setEditSchedule({
          start_date: goal.start_date,
          end_date: goal.end_date,
          time_of_day: goal.time_of_day,
          repeat_type: (goal.repeat_type as RepeatType) ?? "daily",
          repeat_days: goal.repeat_days ?? [],
          reminder_enabled: goal.reminder_enabled ?? false,
          reminder_time: goal.reminder_time,
          reminder_timezone: goal.reminder_timezone,
        });
      }}
      onDelete={() => removeGoal.mutate(goal.id)}
      {...(routine
        ? {
            onRemoveFromRoutine: () =>
              unlinkGoal.mutate({ routineId: routine.id, goalId: goal.id }),
          }
        : {})}
    />
  );

  return (
    <section className="mt-8">
      <header className="px-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Target className="size-5 text-primary" aria-hidden /> Goals &amp; Routines
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create meaningful goals, build healthy routines, and take small steps toward healing.
        </p>
      </header>

      {/* Date navigation */}
      <SoftCard className="mt-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="Previous day"
            onClick={() => setDate((value) => shiftDay(value, -1))}
            className="press flex size-9 items-center justify-center rounded-full border border-border"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-semibold">{friendlyDay(date)}</p>
            <label className="mt-0.5 block text-xs text-muted-foreground">
              <span className="sr-only">Choose a date</span>
              <input
                type="date"
                value={date}
                onChange={(event) => event.target.value && setDate(event.target.value)}
                className="bg-transparent text-center text-xs text-muted-foreground"
              />
            </label>
          </div>
          <button
            type="button"
            aria-label="Next day"
            onClick={() => setDate((value) => shiftDay(value, 1))}
            className="press flex size-9 items-center justify-center rounded-full border border-border"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
        {!isToday ? (
          <button
            type="button"
            onClick={() => setDate(dayKey())}
            className="press mt-2 w-full text-center text-xs font-medium text-primary"
          >
            Back to today
          </button>
        ) : null}
      </SoftCard>

      {!isEmpty ? (
        <SoftCard className="mt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Sprout className="size-4 text-primary" aria-hidden />{" "}
              {isToday ? "Today's Progress" : `${friendlyDay(date)}'s Progress`}
            </p>
            <p className="text-sm text-muted-foreground">
              {doneToday} of {totalToday} completed
            </p>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {totalToday === 0
              ? "Nothing scheduled for this day."
              : allDone
                ? "🎉 Amazing work! You've completed everything planned."
                : "Every small step forward matters."}
          </p>
        </SoftCard>
      ) : null}

      {isEmpty ? (
        <SoftCard className="mt-4 text-center">
          <p className="text-base font-semibold">🌱 Start with one small step.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a personal goal or build a routine that supports your healing journey.
          </p>
          <div className="mt-4 space-y-2">
            <Button className="w-full" onClick={() => setAddGoalFor({ routine: null })}>
              Explore suggested goals
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setRoutineSheet({ routine: null })}
            >
              Explore starter routines
            </Button>
          </div>
        </SoftCard>
      ) : null}

      {standaloneToday.length > 0 ? (
        <div className="mt-5">
          <h3 className="px-1 text-sm font-semibold text-muted-foreground">My Goals</h3>
          <SoftCard className="mt-2 py-2">
            <ul className="divide-y divide-border/60">
              {standaloneToday.map((goal) => goalCard(goal))}
            </ul>
          </SoftCard>
        </div>
      ) : null}

      {!isEmpty ? (
        <button
          type="button"
          onClick={() => setAddGoalFor({ routine: null })}
          className="press mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm font-medium"
        >
          <Plus className="size-4" aria-hidden /> Add Goal
        </button>
      ) : null}

      {activeRoutines.length > 0 ? (
        <div className="mt-6">
          <h3 className="px-1 text-sm font-semibold text-muted-foreground">My Routines</h3>
          <ul className="mt-2 space-y-3">
            {activeRoutines.map((routine) => {
              const Icon = routineIcon(routine.icon);
              const items = goalsForRoutine(routine.id).filter((goal) => isActiveOn(goal, date));
              const done = items.filter((goal) => completions[goal.id]).length;
              const open = expanded.includes(routine.id);
              const routineDone = items.length > 0 && done === items.length;
              return (
                <li key={routine.id}>
                  <SoftCard>
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky">
                        <Icon className="size-5 text-on-tint" aria-hidden />
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          haptic.select();
                          setExpanded((list) =>
                            open
                              ? list.filter((item) => item !== routine.id)
                              : [...list, routine.id],
                          );
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block font-semibold">{routine.title}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {scheduleLabel(routine)} · {timeOfDayLabel(routine.time_of_day)}
                        </span>
                        {routine.reminder_enabled && routine.reminder_time ? (
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-primary">
                            <Bell className="size-3" aria-hidden />{" "}
                            {formatTime12(routine.reminder_time)}
                          </span>
                        ) : null}
                        {routine.description ? (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {routine.description}
                          </span>
                        ) : null}
                        <span className="mt-2 block text-xs font-medium text-muted-foreground">
                          {done} of {items.length} completed
                        </span>
                      </button>
                      <div className="flex shrink-0 items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label={`Options for ${routine.title}`}
                            className="press flex size-8 items-center justify-center rounded-full text-muted-foreground"
                          >
                            <MoreVertical className="size-4" aria-hidden />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setRoutineSheet({ routine })}>
                              Edit routine
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAddGoalFor({ routine })}>
                              Add goal
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setExpanded((list) =>
                                  list.includes(routine.id) ? list : [...list, routine.id],
                                )
                              }
                            >
                              Manage goals
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteRoutine(routine)}
                            >
                              Delete routine
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-500"
                        style={{
                          width: `${items.length === 0 ? 0 : Math.round((done / items.length) * 100)}%`,
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((list) =>
                          open ? list.filter((item) => item !== routine.id) : [...list, routine.id],
                        )
                      }
                      className="press mt-3 flex w-full items-center justify-center gap-1 text-xs font-medium text-muted-foreground"
                    >
                      {open ? "Hide goals" : "Tap to expand"}
                      <ChevronDown
                        className={cn("size-4 transition-transform", open && "rotate-180")}
                        aria-hidden
                      />
                    </button>

                    {open ? (
                      <div className="mt-1">
                        <ul className="divide-y divide-border/60">
                          {items.map((goal) => goalCard(goal, routine))}
                        </ul>
                        {routineDone ? (
                          <p className="mt-2 rounded-2xl bg-mint/50 px-3 py-2 text-center text-xs font-medium">
                            🎉 Routine Complete! Great job showing up for yourself.
                          </p>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setAddGoalFor({ routine })}
                          className="press mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-2.5 text-sm font-medium"
                        >
                          <Plus className="size-4" aria-hidden /> Add Goal
                        </button>
                      </div>
                    ) : null}
                  </SoftCard>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {!isEmpty ? (
        <button
          type="button"
          onClick={() => setRoutineSheet({ routine: null })}
          className="press mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm font-medium"
        >
          <Plus className="size-4" aria-hidden /> Create Routine
        </button>
      ) : null}

      <AddGoalSheet
        open={Boolean(addGoalFor)}
        onOpenChange={(value) => !value && setAddGoalFor(null)}
        context={addGoalFor?.routine?.title}
        busy={addGoals.isPending || linkGoals.isPending}
        existingGoals={standalone}
        {...(addGoalFor?.routine
          ? {
              onLinkExisting: async (goalIds: string[]) => {
                const routineId = addGoalFor.routine?.id;
                if (routineId) await linkGoals.mutateAsync({ routineId, goalIds });
              },
            }
          : {})}
        onAdd={async (inputs) => {
          await addGoals.mutateAsync({ inputs, routineId: addGoalFor?.routine?.id ?? null });
        }}
      />

      <RoutineSheet
        open={Boolean(routineSheet)}
        onOpenChange={(value) => !value && setRoutineSheet(null)}
        routine={routineSheet?.routine ?? null}
        busy={saveRoutine.isPending}
        onSave={async (input, starterGoals) => {
          await saveRoutine.mutateAsync({
            routine: routineSheet?.routine ?? null,
            input,
            starterGoals,
          });
        }}
      />

      <Dialog open={Boolean(editGoal)} onOpenChange={(value) => !value && setEditGoal(null)}>
        <DialogContent className="max-h-[86vh] max-w-sm overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>Edit goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-goal-title">Goal title</Label>
              <Input
                id="edit-goal-title"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-goal-desc">Description</Label>
              <Textarea
                id="edit-goal-desc"
                rows={3}
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
              />
            </div>
            {editGoal ? (
              <p className="text-xs text-muted-foreground">
                Category: {categoryLabel(editGoal.category)}
              </p>
            ) : null}
            <div className="border-t border-border pt-4">
              <ScheduleFields value={editSchedule} onChange={setEditSchedule} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGoal(null)}>
              Cancel
            </Button>
            <Button
              disabled={!editTitle.trim() || saveGoal.isPending}
              onClick={() => {
                if (!editGoal) return;
                saveGoal.mutate({
                  goalId: editGoal.id,
                  patch: {
                    title: editTitle,
                    description: editDescription,
                    start_date: editSchedule.start_date,
                    end_date: editSchedule.end_date,
                    time_of_day: editSchedule.time_of_day,
                    repeat_type: editSchedule.repeat_type,
                    repeat_days: editSchedule.repeat_days,
                    reminder_enabled: editSchedule.reminder_enabled,
                    reminder_time: editSchedule.reminder_time,
                    reminder_timezone: editSchedule.reminder_timezone,
                  },
                });
                setEditGoal(null);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteRoutine)}
        onOpenChange={(value) => !value && setDeleteRoutine(null)}
      >
        <AlertDialogContent className="max-w-sm rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteRoutine?.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the routine and its goals from your active routines.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteRoutine) removeRoutine.mutate(deleteRoutine.id);
                setDeleteRoutine(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
