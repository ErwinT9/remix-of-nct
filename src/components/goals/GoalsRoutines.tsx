import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, MoreVertical, Plus, Sprout, Target } from "lucide-react";
import { useState } from "react";

import { SoftCard } from "@/components/SoftCard";
import { AddGoalSheet } from "@/components/goals/AddGoalSheet";
import { RoutineSheet } from "@/components/goals/RoutineSheet";
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
import { categoryLabel, goalShortcut, routineIcon } from "@/lib/goals";
import { haptic } from "@/lib/native/haptics";
import { cn } from "@/lib/utils";

function GoalRow({
  goal,
  done,
  onToggle,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  done: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
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
  const queryKey = ["goals-routines", userId];

  const [addGoalFor, setAddGoalFor] = useState<{ routine: Routine | null } | null>(null);
  const [routineSheet, setRoutineSheet] = useState<{ routine: Routine | null } | null>(null);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [deleteRoutine, setDeleteRoutine] = useState<Routine | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);

  const snapshot = useQuery({
    queryKey,
    queryFn: () => goalsRepo.load(userId),
    enabled: Boolean(userId),
  });

  const data = snapshot.data;
  const routines = data?.routines ?? [];
  const goals = data?.goals ?? [];
  const completions = data?.completions ?? {};
  const standalone = goals.filter((goal) => !goal.routine_id);

  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const toggle = useMutation({
    mutationFn: ({ goalId, completed }: { goalId: string; completed: boolean }) =>
      goalsRepo.setCompleted(userId, goalId, completed),
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
    mutationFn: async ({ inputs, routineId }: { inputs: GoalInput[]; routineId: string | null }) => {
      const base = goals.filter((goal) => goal.routine_id === routineId).length;
      await goalsRepo.addGoals(
        userId,
        inputs.map((input) => ({ ...input, routine_id: routineId })),
        base,
      );
    },
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

  const totalToday = goals.length;
  const doneToday = goals.filter((goal) => completions[goal.id]).length;
  const percent = totalToday === 0 ? 0 : Math.round((doneToday / totalToday) * 100);
  const allDone = totalToday > 0 && doneToday === totalToday;
  const isEmpty = totalToday === 0 && routines.length === 0;

  const goalCard = (goal: Goal) => (
    <GoalRow
      key={goal.id}
      goal={goal}
      done={Boolean(completions[goal.id])}
      onToggle={() => {
        haptic.light();
        toggle.mutate({ goalId: goal.id, completed: !completions[goal.id] });
      }}
      onEdit={() => {
        setEditGoal(goal);
        setEditTitle(goal.title);
        setEditDescription(goal.description ?? "");
      }}
      onDelete={() => removeGoal.mutate(goal.id)}
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

      {!isEmpty ? (
        <SoftCard className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Sprout className="size-4 text-primary" aria-hidden /> Today&apos;s Progress
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
            {allDone
              ? "🎉 Amazing work! You've completed everything planned for today."
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

      {standalone.length > 0 ? (
        <div className="mt-5">
          <h3 className="px-1 text-sm font-semibold text-muted-foreground">My Goals</h3>
          <SoftCard className="mt-2 py-2">
            <ul className="divide-y divide-border/60">{standalone.map(goalCard)}</ul>
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

      {routines.length > 0 ? (
        <div className="mt-6">
          <h3 className="px-1 text-sm font-semibold text-muted-foreground">My Routines</h3>
          <ul className="mt-2 space-y-3">
            {routines.map((routine) => {
              const Icon = routineIcon(routine.icon);
              const items = goals.filter((goal) => goal.routine_id === routine.id);
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
                        <ul className="divide-y divide-border/60">{items.map(goalCard)}</ul>
                        {routineDone ? (
                          <p className="mt-2 rounded-2xl bg-mint/50 px-3 py-2 text-center text-xs font-medium">
                            🎉 Routine Complete! Great job showing up for yourself today.
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
        busy={addGoals.isPending}
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
        <DialogContent className="max-w-sm rounded-3xl">
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
                  patch: { title: editTitle, description: editDescription },
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
