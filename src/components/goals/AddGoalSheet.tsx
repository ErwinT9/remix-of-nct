import { Check, Pencil, Star } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { GoalInput } from "@/data/goalsRepo";
import { GOAL_CATEGORIES, SUGGESTED_GOALS, type GoalCategory } from "@/lib/goals";
import { haptic } from "@/lib/native/haptics";
import { cn } from "@/lib/utils";

export function AddGoalSheet({
  open,
  onOpenChange,
  onAdd,
  context,
  busy,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onAdd: (goals: GoalInput[]) => Promise<void> | void;
  /** Routine name when adding inside a routine. */
  context?: string | undefined;
  busy?: boolean;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [custom, setCustom] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory>("self-care");

  useEffect(() => {
    if (open) {
      setPicked([]);
      setCustom(false);
      setTitle("");
      setDescription("");
      setCategory("self-care");
    }
  }, [open]);

  const toggle = (goalTitle: string) => {
    haptic.select();
    setPicked((list) =>
      list.includes(goalTitle) ? list.filter((item) => item !== goalTitle) : [...list, goalTitle],
    );
  };

  const submit = async () => {
    if (custom) {
      if (!title.trim()) return;
      await onAdd([{ title, description, category, is_custom: true }]);
    } else {
      if (picked.length === 0) return;
      const flat = SUGGESTED_GOALS.flatMap((group) => group.goals);
      await onAdd(
        picked.map((goalTitle) => {
          const found = flat.find((item) => item.title === goalTitle);
          return { title: goalTitle, category: found?.category ?? "other", is_custom: false };
        }),
      );
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[86vh] w-full max-w-md overflow-y-auto rounded-t-3xl px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl">
            {context ? `Add a goal to ${context}` : "Add a goal"}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setCustom(false)}
            className={cn(
              "press flex-1 rounded-2xl border px-3 py-2 text-sm font-medium",
              custom ? "border-border text-muted-foreground" : "border-primary bg-muted",
            )}
          >
            <Star className="mr-1.5 inline size-4" aria-hidden /> Suggested
          </button>
          <button
            type="button"
            onClick={() => setCustom(true)}
            className={cn(
              "press flex-1 rounded-2xl border px-3 py-2 text-sm font-medium",
              custom ? "border-primary bg-muted" : "border-border text-muted-foreground",
            )}
          >
            <Pencil className="mr-1.5 inline size-4" aria-hidden /> Custom
          </button>
        </div>

        {custom ? (
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
        ) : (
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
        )}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={busy || (custom ? !title.trim() : picked.length === 0)}
            onClick={() => void submit()}
          >
            {custom ? "Add goal" : `Add${picked.length ? ` ${picked.length}` : ""}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
