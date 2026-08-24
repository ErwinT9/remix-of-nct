import { useEffect, useState } from "react";

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
  type RoutineTimeCategory,
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

  useEffect(() => {
    if (!open) return;
    setTitle(routine?.title ?? "");
    setDescription(routine?.description ?? "");
    setIcon(routine?.icon ?? "sunrise");
    setTime((routine?.time_category as RoutineTimeCategory) ?? "anytime");
  }, [open, routine]);

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

        {!editing ? (
          <section className="mt-3">
            <h3 className="text-sm font-semibold">Starter routines</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Add a ready-made routine, then customise it however you like.
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
                        void Promise.resolve(
                          onSave(
                            {
                              title: starter.title,
                              description: starter.description,
                              icon: starter.icon,
                              time_category: starter.time_category,
                              is_starter: true,
                            },
                            starter.goals.map((goal) => ({ ...goal, is_custom: false })),
                          ),
                        ).then(() => onOpenChange(false));
                      }}
                      className="press flex w-full items-center gap-3 rounded-2xl border border-border px-4 py-3 text-left"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-mint">
                        <Icon className="size-4 text-on-tint" aria-hidden />
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
            <div className="mt-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or build your own</span>
              <span className="h-px flex-1 bg-border" />
            </div>
          </section>
        ) : null}

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
          <div className="space-y-1.5">
            <Label>Time of day</Label>
            <div className="flex flex-wrap gap-2">
              {TIME_CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTime(item.id)}
                  className={cn(
                    "press rounded-full border px-3 py-1.5 text-xs font-medium",
                    time === item.id ? "border-primary bg-muted" : "border-border",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={busy || !title.trim()}
            onClick={() => {
              void Promise.resolve(
                onSave({ title, description, icon, time_category: time }, []),
              ).then(() => onOpenChange(false));
            }}
          >
            {editing ? "Save changes" : "Create routine"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
