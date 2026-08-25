import { useEffect, useState } from "react";

import {
  ScheduleFields,
  defaultSchedule,
  type ScheduleValue,
} from "@/components/goals/ScheduleFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { GoalInput, Routine, RoutineInput } from "@/data/goalsRepo";
import {
  ROUTINE_ICONS,
  routineIcon,
  STARTER_ROUTINES,
  TIME_CATEGORIES,
  type RepeatType,
  type RoutineTimeCategory,
  type SuggestedGoal,
} from "@/lib/goals";
import { haptic } from "@/lib/native/haptics";
import { cn } from "@/lib/utils";

export function RoutineSheet({
  open,
  onOpenChange,
  routine,
  onSave,
  busy,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  /** Existing routine when editing, null when creating. */
  routine?: Routine | null;
  onSave: (input: RoutineInput, goals: GoalInput[]) => Promise<void> | void;
  busy?: boolean;
}) {
  const editing = Boolean(routine);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("sunrise");
  const [time, setTime] = useState<RoutineTimeCategory>("anytime");
  const [schedule, setSchedule] = useState<ScheduleValue>(() => defaultSchedule());
  const [starterGoals, setStarterGoals] = useState<SuggestedGoal[]>([]);
  const [customising, setCustomising] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(routine?.title ?? "");
    setDescription(routine?.description ?? "");
    setIcon(routine?.icon ?? "sunrise");
    setTime((routine?.time_category as RoutineTimeCategory) ?? "anytime");
    setStarterGoals([]);
    setCustomising(Boolean(routine));
    setSchedule({
      start_date: routine?.start_date ?? defaultSchedule().start_date,
      end_date: routine?.end_date ?? null,
      time_of_day: routine?.time_of_day ?? routine?.time_category ?? "anytime",
      repeat_type: (routine?.repeat_type as RepeatType) ?? "daily",
      repeat_days: routine?.repeat_days ?? [],
    });
  }, [open, routine]);

  const save = () => {
    void Promise.resolve(
      onSave(
        {
          title,
          description,
          icon,
          time_category: schedule.time_of_day,
          is_starter: starterGoals.length > 0,
          start_date: schedule.start_date,
          end_date: schedule.end_date,
          time_of_day: schedule.time_of_day,
          repeat_type: schedule.repeat_type,
          repeat_days: schedule.repeat_days,
        },
        starterGoals.map((goal) => ({ ...goal, is_custom: false })),
      ),
    ).then(() => onOpenChange(false));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl">
            {editing ? "Edit routine" : "Create a routine"}
          </SheetTitle>
        </SheetHeader>

        {!editing && !customising ? (
          <section className="mt-3">
            <h3 className="text-sm font-semibold">⭐ Starter routines</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick one, then customise its name, icon, goals and schedule before saving.
            </p>
            <ul className="mt-3 space-y-2">
              {STARTER_ROUTINES.map((starter) => {
                const Icon = routineIcon(starter.icon);
                return (
                  <li key={starter.title}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        haptic.select();
                        setTitle(starter.title);
                        setDescription(starter.description);
                        setIcon(starter.icon);
                        setTime(starter.time_category);
                        setStarterGoals(starter.goals);
                        setSchedule({
                          ...defaultSchedule(starter.time_category),
                          repeat_type: "daily",
                        });
                        setCustomising(true);
                      }}
                      className="press flex w-full items-center gap-3 rounded-2xl border border-border px-4 py-3 text-left"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky">
                        <Icon className="size-5 text-on-tint" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{starter.title}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {starter.goals.length} goals · {starter.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => setCustomising(true)}
              className="press mt-4 w-full rounded-2xl border border-dashed border-border py-3 text-sm font-medium"
            >
              + Build Your Own
            </button>
          </section>
        ) : null}

        {editing || customising ? (
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="routine-title">Routine name</Label>
              <Input
                id="routine-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Morning Reset"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="routine-desc">Description (optional)</Label>
              <Textarea
                id="routine-desc"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Start your day focused on yourself."
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {ROUTINE_ICONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={item.id}
                      onClick={() => setIcon(item.id)}
                      className={cn(
                        "press flex size-10 items-center justify-center rounded-2xl border",
                        icon === item.id ? "border-primary bg-muted" : "border-border",
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <ScheduleFields value={schedule} onChange={setSchedule} startLabel="Starts" />
            </div>

            {starterGoals.length > 0 ? (
              <div className="space-y-2">
                <Label>Included goals</Label>
                <ul className="space-y-1.5">
                  {starterGoals.map((goal) => (
                    <li
                      key={goal.title}
                      className="flex items-center gap-2 rounded-2xl border border-border px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 flex-1">{goal.title}</span>
                      <button
                        type="button"
                        className="press text-xs font-medium text-destructive"
                        onClick={() =>
                          setStarterGoals((list) =>
                            list.filter((item) => item.title !== goal.title),
                          )
                        }
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  You can add suggested, existing or brand-new goals after creating the routine.
                </p>
              </div>
            ) : null}

            {/* time_category kept in sync with the schedule's time of day */}
            <input type="hidden" value={time} readOnly />
          </div>
        ) : null}

        {editing || customising ? (
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={busy || !title.trim()} onClick={save}>
              {editing ? "Save changes" : "Create routine"}
            </Button>
          </div>
        ) : null}

        {!editing && !customising ? (
          <div className="mt-6">
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        ) : null}

        <p className="sr-only">{TIME_CATEGORIES.length} time-of-day options available</p>
      </SheetContent>
    </Sheet>
  );
}
