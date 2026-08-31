import { Check, ListChecks, Pencil, Star } from "lucide-react";
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
import type { Goal, GoalInput } from "@/data/goalsRepo";
import {
  GOAL_CATEGORIES,
  SUGGESTED_GOALS,
  scheduleLabel,
  timeOfDayLabel,
  type GoalCategory,
} from "@/lib/goals";
import { haptic } from "@/lib/native/haptics";
import { cn } from "@/lib/utils";

type Mode = "suggested" | "existing" | "custom";

export function AddGoalSheet({
  open,
  onOpenChange,
  onAdd,
  onLinkExisting,
  existingGoals = [],
  context,
  busy,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onAdd: (goals: GoalInput[]) => Promise<void> | void;
  /** Attach already-created goals to the current routine (routine context only). */
  onLinkExisting?: (goalIds: string[]) => Promise<void> | void;
  existingGoals?: Goal[];
  /** Routine name when adding inside a routine. */
  context?: string | undefined;
  busy?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("suggested");
  const [picked, setPicked] = useState<string[]>([]);
  const [pickedExisting, setPickedExisting] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory>("self-care");
  const [schedule, setSchedule] = useState<ScheduleValue>(() => defaultSchedule());

  useEffect(() => {
    if (open) {
      setMode("suggested");
      setPicked([]);
      setPickedExisting([]);
      setTitle("");
      setDescription("");
      setCategory("self-care");
      setSchedule({ ...defaultSchedule(), repeat_type: "daily" });
    }
  }, [open]);

  const toggle = (goalTitle: string) => {
    haptic.select();
    setPicked((list) =>
      list.includes(goalTitle) ? list.filter((item) => item !== goalTitle) : [...list, goalTitle],
    );
  };

  const canSubmit =
    mode === "custom"
      ? Boolean(title.trim())
      : mode === "existing"
        ? pickedExisting.length > 0
        : picked.length > 0;

  const submit = async () => {
    const scheduleInput = {
      start_date: schedule.start_date,
      end_date: schedule.end_date,
      time_of_day: schedule.time_of_day,
      repeat_type: schedule.repeat_type,
      repeat_days: schedule.repeat_days,
      reminder_enabled: schedule.reminder_enabled,
      reminder_time: schedule.reminder_time,
      reminder_timezone: schedule.reminder_timezone,
    };
    if (mode === "existing") {
      if (pickedExisting.length === 0) return;
      await onLinkExisting?.(pickedExisting);
    } else if (mode === "custom") {
      if (!title.trim()) return;
      await onAdd([{ title, description, category, is_custom: true, ...scheduleInput }]);
    } else {
      if (picked.length === 0) return;
      const flat = SUGGESTED_GOALS.flatMap((group) => group.goals);
      await onAdd(
        picked.map((goalTitle) => {
          const found = flat.find((item) => item.title === goalTitle);
          return {
            title: goalTitle,
            category: found?.category ?? "other",
            is_custom: false,
            ...scheduleInput,
          };
        }),
      );
    }
    onOpenChange(false);
  };

  const tab = (id: Mode, label: string, Icon: typeof Star) => (
    <button
      type="button"
      onClick={() => setMode(id)}
      className={cn(
        "press flex-1 rounded-2xl border px-2 py-2 text-xs font-medium",
        mode === id ? "border-primary bg-muted" : "border-border text-muted-foreground",
      )}
    >
      <Icon className="mr-1 inline size-4" aria-hidden /> {label}
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[86vh] w-full max-w-md overflow-y-auto rounded-t-3xl px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl">
            {context ? `Add to ${context}` : "Add a goal"}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-2 flex gap-2">
          {tab("suggested", "Suggested", Star)}
          {onLinkExisting && existingGoals.length > 0
            ? tab("existing", "My Goals", ListChecks)
            : null}
          {tab("custom", "Create New", Pencil)}
        </div>

        {mode === "custom" ? (
          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="goal-title">Goal title</Label>
              <Input
                id="goal-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Go to the gym after work"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-desc">Description (optional)</Label>
              <Textarea
                id="goal-desc"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Focus on myself and take care of my body."
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {GOAL_CATEGORIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    className={cn(
                      "press rounded-full border px-3 py-1.5 text-xs font-medium",
                      category === item.id ? "border-primary bg-muted" : "border-border",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {mode === "suggested" ? (
          <div className="mt-5 space-y-5">
            {SUGGESTED_GOALS.map((group) => (
              <section key={group.category}>
                <h3 className="text-sm font-semibold">{group.label}</h3>
                <ul className="mt-2 space-y-2">
                  {group.goals.map((goal) => {
                    const active = picked.includes(goal.title);
                    return (
                      <li key={goal.title}>
                        <button
                          type="button"
                          onClick={() => toggle(goal.title)}
                          className={cn(
                            "press flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm",
                            active ? "border-primary bg-muted" : "border-border",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-full border",
                              active ? "border-primary bg-primary" : "border-muted-foreground/40",
                            )}
                          >
                            {active ? (
                              <Check className="size-3.5 text-primary-foreground" aria-hidden />
                            ) : null}
                          </span>
                          <span className="min-w-0 flex-1">{goal.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        ) : null}

        {mode === "existing" ? (
          <div className="mt-5">
            <p className="text-xs text-muted-foreground">
              Add goals you already created. They stay a single goal — no duplicates.
            </p>
            <ul className="mt-3 space-y-2">
              {existingGoals.map((goal) => {
                const active = pickedExisting.includes(goal.id);
                return (
                  <li key={goal.id}>
                    <button
                      type="button"
                      onClick={() => {
                        haptic.select();
                        setPickedExisting((list) =>
                          list.includes(goal.id)
                            ? list.filter((item) => item !== goal.id)
                            : [...list, goal.id],
                        );
                      }}
                      className={cn(
                        "press flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm",
                        active ? "border-primary bg-muted" : "border-border",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border",
                          active ? "border-primary bg-primary" : "border-muted-foreground/40",
                        )}
                      >
                        {active ? (
                          <Check className="size-3.5 text-primary-foreground" aria-hidden />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        {goal.title}
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {scheduleLabel(goal)} · {timeOfDayLabel(goal.time_of_day)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {mode !== "existing" ? (
          <div className="mt-6 border-t border-border pt-5">
            <ScheduleFields value={schedule} onChange={setSchedule} />
          </div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={busy || !canSubmit} onClick={() => void submit()}>
            {mode === "custom"
              ? "Add goal"
              : mode === "existing"
                ? `Add${pickedExisting.length ? ` ${pickedExisting.length}` : ""}`
                : `Add${picked.length ? ` ${picked.length}` : ""}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
