import { Check, Plus, X } from "lucide-react";
import { useState } from "react";

import { SubScreen } from "@/components/SubScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActivityProps } from "@/components/journey/activities";
import { haptic } from "@/lib/native/haptics";
import { cn } from "@/lib/utils";

/* Shared bits ------------------------------------------------------- */

function CompletionPanel({ message, onExit }: { message: string; onExit: () => void }) {
  return (
    <div className="animate-in fade-in zoom-in-95 flex flex-col items-center py-8 duration-500">
      <span className="flex size-20 items-center justify-center rounded-full bg-mint animate-[pulse_2.4s_ease-in-out_infinite]">
        <Check className="size-9 text-on-tint" aria-hidden />
      </span>
      <p className="mt-6 text-center text-base font-medium">{message}</p>
      <Button className="press mt-8 h-12 w-full rounded-2xl" onClick={onExit}>
        Back to Journey
      </Button>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "press rounded-full border border-border px-4 py-2 text-sm",
        active ? "bg-mint text-on-tint border-transparent" : "bg-background",
      )}
    >
      {label}
    </button>
  );
}

function dayMessage(days: number, required: number): string {
  if (days >= required)
    return "You've practised on enough different days. You can finish this activity now.";
  if (required - days === 1) return `Day ${days} of ${required} complete. One more day remains.`;
  if (days === 0) return `Day 0 of ${required} complete. Save today to begin.`;
  return `Day ${days} of ${required} complete. Return another day to continue.`;
}

/* Activity 1 — Find One Good Thing ------------------------------------ */

const GOOD_PROMPTS = [
  "Something that made me smile",
  "A small kindness I noticed",
  "Something that tasted, felt, or sounded good",
  "A moment of calm",
  "Something that went better than expected",
];

export function OneGoodThingActivity({ progress, onComplete, onExit, busy }: ActivityProps) {
  const saved = progress?.data ?? {};
  const [prompt, setPrompt] = useState<string | null>(
    (saved["prompt"] as string | undefined) ?? null,
  );
  const [text, setText] = useState((saved["text"] as string | undefined) ?? "");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <SubScreen title="Find One Good Thing">
        <CompletionPanel
          message="You found the good in today. It was there all along — you just looked."
          onExit={onExit}
        />
      </SubScreen>
    );
  }

  return (
    <SubScreen
      title="Find One Good Thing"
      description="Notice one positive thing from your day, no matter how small."
    >
      <h2 className="px-1 font-semibold">Where did the good show up today?</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {GOOD_PROMPTS.map((item) => (
          <li key={item}>
            <Chip
              label={item}
              active={prompt === item}
              onClick={() => {
                haptic.select();
                setPrompt(item);
              }}
            />
          </li>
        ))}
      </ul>
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Write down the one good thing — even 'the coffee was warm' counts."
        className="mt-4 min-h-28 rounded-2xl"
      />
      <Button
        className="press mt-8 h-12 w-full rounded-2xl"
        disabled={!text.trim() || busy}
        onClick={async () => {
          await onComplete({ prompt, text });
          haptic.success();
          setDone(true);
        }}
      >
        Complete Activity
      </Button>
    </SubScreen>
  );
}

/* Activity 2 — A Moment Worth Remembering (2 days) -------------------- */

export function WorthyMomentActivity({
  progress,
  onMarkDay,
  onComplete,
  onExit,
  busy,
}: ActivityProps) {
  const [text, setText] = useState("");
  const [savedToday, setSavedToday] = useState(false);
  const [done, setDone] = useState(false);
  const days = progress?.day_dates?.length ?? 0;

  if (done) {
    return (
      <SubScreen title="A Moment Worth Remembering">
        <CompletionPanel
          message="Two moments worth remembering. Your life has held more good than it felt like."
          onExit={onExit}
        />
      </SubScreen>
    );
  }

  return (
    <SubScreen
      title="A Moment Worth Remembering"
      description="Write about good or meaningful moments that make you smile, over two different days."
    >
      <p className="soft-card rounded-3xl p-5 text-sm text-muted-foreground">
        Save one memory on 2 different days. The days do not need to be in a row, and saving
        twice on the same day still counts as one day.
      </p>

      <div className="soft-card mt-5 space-y-4 rounded-3xl p-5">
        <h2 className="font-semibold">
          {days === 0 ? "A moment that makes you smile" : "Another meaningful or positive memory"}
        </h2>
        <Textarea
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setSavedToday(false);
          }}
          placeholder={
            days === 0
              ? "A moment from your life — big or small — that still warms you."
              : "Another memory you'd like to keep."
          }
          className="min-h-28 rounded-2xl"
        />
        <Button
          className="press h-12 w-full rounded-2xl"
          disabled={!text.trim() || busy || savedToday}
          onClick={async () => {
            await onMarkDay();
            haptic.success();
            setSavedToday(true);
            setText("");
          }}
        >
          {savedToday ? "Saved for today" : "Save today's memory"}
        </Button>
      </div>

      <p className="mt-5 px-1 text-center text-sm text-muted-foreground">{dayMessage(days, 2)}</p>

      {days >= 2 ? (
        <Button
          className="press mt-4 h-12 w-full rounded-2xl"
          disabled={busy}
          onClick={async () => {
            await onComplete();
            haptic.success();
            setDone(true);
          }}
        >
          Complete Activity
        </Button>
      ) : (
        <Button variant="secondary" className="press mt-4 h-12 w-full rounded-2xl" onClick={onExit}>
          Back to Journey
        </Button>
      )}
    </SubScreen>
  );
}

/* Activity 3 — Appreciate What You Have ------------------------------- */

const APPRECIATE_AREAS = [
  "People in my life",
  "A place I love",
  "An experience I've had",
  "Something my body can do",
  "A simple everyday comfort",
];

export function AppreciateActivity({ progress, onComplete, onExit, busy }: ActivityProps) {
  const saved = progress?.data ?? {};
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      APPRECIATE_AREAS.map((area) => [area, (saved[area] as string | undefined) ?? ""]),
    ),
  );
  const [done, setDone] = useState(false);

  const current = APPRECIATE_AREAS[step]!;
  const isLast = step === APPRECIATE_AREAS.length - 1;
  const value = answers[current] ?? "";

  if (done) {
    return (
      <SubScreen title="Appreciate What You Have">
        <CompletionPanel
          message="You just listed what's already good in your life. It's more than it sometimes feels."
          onExit={onExit}
        />
      </SubScreen>
    );
  }

  return (
    <SubScreen
      title="Appreciate What You Have"
      description="Reflect on the people, places, experiences, abilities, and simple things you appreciate."
    >
      <p className="soft-card rounded-3xl p-5 text-sm text-muted-foreground">
        Step {step + 1} of {APPRECIATE_AREAS.length}
      </p>

      <div key={current} className="animate-in fade-in slide-in-from-right-4 duration-300">
        <h2 className="mt-6 px-1 font-semibold">{current}</h2>
        <Textarea
          value={value}
          onChange={(event) => setAnswers((prev) => ({ ...prev, [current]: event.target.value }))}
          placeholder="Who or what comes to mind?"
          className="mt-3 min-h-28 rounded-2xl"
        />
      </div>

      <div className="mt-8 flex gap-3">
        {step > 0 ? (
          <Button
            variant="secondary"
            className="press h-12 flex-1 rounded-2xl"
            onClick={() => setStep((value) => value - 1)}
          >
            Back
          </Button>
        ) : null}
        <Button
          className="press h-12 flex-1 rounded-2xl"
          disabled={!value.trim() || busy}
          onClick={async () => {
            if (!isLast) {
              haptic.light();
              setStep((current) => current + 1);
              return;
            }
            await onComplete({ ...answers });
            haptic.success();
            setDone(true);
          }}
        >
          {isLast ? "Complete Activity" : "Continue"}
        </Button>
      </div>
    </SubScreen>
  );
}

/* Activity 4 — Gratitude in Practice (4 days) ------------------------- */

const GRATITUDE_IDEAS = [
  "A person I'm glad exists",
  "Something my body lets me do",
  "A comfort I often overlook",
  "Something in nature",
  "A small win today",
  "Something I learned",
];

export function GratitudePracticeActivity({
  progress,
  onMarkDay,
  onComplete,
  onExit,
  busy,
}: ActivityProps) {
  const [idea, setIdea] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [savedToday, setSavedToday] = useState(false);
  const [done, setDone] = useState(false);
  const days = progress?.day_dates?.length ?? 0;
  const chosen = idea ?? (custom.trim() || null);

  if (done) {
    return (
      <SubScreen title="Gratitude in Practice">
        <CompletionPanel
          message="Four days of noticing the good. That's a habit your mind will keep."
          onExit={onExit}
        />
      </SubScreen>
    );
  }

  return (
    <SubScreen
      title="Gratitude in Practice"
      description="Record at least one thing you're grateful for, on four different days."
    >
      <p className="soft-card rounded-3xl p-5 text-sm text-muted-foreground">
        Log one thing you're grateful for on 4 different days. The days do not need to be in a
        row, and logging twice on the same day still counts as one day.
      </p>

      <div className="soft-card mt-5 space-y-4 rounded-3xl p-5">
        <h2 className="font-semibold">Today I'm grateful for…</h2>
        <ul className="flex flex-wrap gap-2">
          {GRATITUDE_IDEAS.map((item) => (
            <li key={item}>
              <Chip
                label={item}
                active={idea === item}
                onClick={() => {
                  haptic.select();
                  setIdea(item);
                  setCustom("");
                  setSavedToday(false);
                }}
              />
            </li>
          ))}
        </ul>
        <Input
          value={custom}
          onChange={(event) => {
            setCustom(event.target.value);
            setIdea(null);
            setSavedToday(false);
          }}
          placeholder="Or write your own"
          className="h-12 rounded-2xl"
        />
        <Button
          className="press h-12 w-full rounded-2xl"
          disabled={!chosen || busy || savedToday}
          onClick={async () => {
            await onMarkDay();
            haptic.success();
            setSavedToday(true);
            setIdea(null);
            setCustom("");
          }}
        >
          {savedToday ? "Logged for today" : "Save today's gratitude"}
        </Button>
      </div>

      <p className="mt-5 px-1 text-center text-sm text-muted-foreground">{dayMessage(days, 4)}</p>

      {days >= 4 ? (
        <Button
          className="press mt-4 h-12 w-full rounded-2xl"
          disabled={busy}
          onClick={async () => {
            await onComplete();
            haptic.success();
            setDone(true);
          }}
        >
          Complete Activity
        </Button>
      ) : (
        <Button variant="secondary" className="press mt-4 h-12 w-full rounded-2xl" onClick={onExit}>
          Back to Journey
        </Button>
      )}
    </SubScreen>
  );
}

/* Activity 5 — My Good Things List ------------------------------------ */

export function GoodThingsListActivity({ progress, onComplete, onExit, busy }: ActivityProps) {
  const saved = progress?.data ?? {};
  const [items, setItems] = useState<string[]>((saved["items"] as string[] | undefined) ?? []);
  const [draft, setDraft] = useState("");
  const [done, setDone] = useState(false);

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    haptic.light();
    setItems((prev) => [...prev, value]);
    setDraft("");
  };

  if (done) {
    return (
      <SubScreen title="Level 4 Complete">
        <CompletionPanel
          message="You completed Level 4: Notice the Good. Your list is saved for the days you need reminding."
          onExit={onExit}
        />
      </SubScreen>
    );
  }

  return (
    <SubScreen
      title="My Good Things List"
      description="A personal list of things that bring meaning, comfort, happiness, or hope into your life."
    >
      <p className="soft-card rounded-3xl p-5 text-sm text-muted-foreground">
        Add at least 3 things. Come back to this list whenever the good feels hard to see.
      </p>

      <div className="mt-5 flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          placeholder="Something good in your life"
          className="h-12 flex-1 rounded-2xl"
        />
        <Button
          type="button"
          size="icon"
          aria-label="Add item"
          className="press size-12 rounded-2xl"
          disabled={!draft.trim()}
          onClick={add}
        >
          <Plus className="size-5" aria-hidden />
        </Button>
      </div>

      {items.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="soft-card flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm"
            >
              <span>{item}</span>
              <button
                type="button"
                aria-label={`Remove ${item}`}
                className="press text-muted-foreground"
                onClick={() => {
                  haptic.light();
                  setItems((prev) => prev.filter((_, i) => i !== index));
                }}
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Button
        className="press mt-8 h-12 w-full rounded-2xl"
        disabled={items.length < 3 || busy}
        onClick={async () => {
          await onComplete({ items, written_at: new Date().toISOString() });
          haptic.success();
          setDone(true);
        }}
      >
        Complete Activity
      </Button>
    </SubScreen>
  );
}
