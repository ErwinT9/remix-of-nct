import { Check } from "lucide-react";
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

/* Activity 1 — Accept What You Cannot Change --------------------------- */

export function AcceptActivity({ progress, onComplete, onExit, busy }: ActivityProps) {
  const saved = progress?.data ?? {};
  const [cannot, setCannot] = useState((saved["cannot_change"] as string | undefined) ?? "");
  const [focus, setFocus] = useState((saved["focus_today"] as string | undefined) ?? "");
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <SubScreen title="Accept What You Cannot Change">
        <CompletionPanel
          message="Acceptance isn't giving up — it's choosing where your energy goes."
          onExit={onExit}
        />
      </SubScreen>
    );
  }

  return (
    <SubScreen
      title="Accept What You Cannot Change"
      description="Reflect on what is outside your control and what you can choose to focus on today."
    >
      {step === 0 ? (
        <div className="animate-in fade-in duration-300">
          <h2 className="px-1 font-semibold">
            What is outside your control that you've been fighting against?
          </h2>
          <Textarea
            value={cannot}
            onChange={(event) => setCannot(event.target.value)}
            placeholder="The past, someone else's choices, how they feel…"
            className="mt-3 min-h-28 rounded-2xl"
          />
          <Button
            className="press mt-8 h-12 w-full rounded-2xl"
            disabled={!cannot.trim()}
            onClick={() => {
              haptic.light();
              setStep(1);
            }}
          >
            Continue
          </Button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="px-1 font-semibold">What can you choose to focus on today instead?</h2>
          <Textarea
            value={focus}
            onChange={(event) => setFocus(event.target.value)}
            placeholder="Something within your reach, right now."
            className="mt-3 min-h-28 rounded-2xl"
          />
          <Button
            className="press mt-8 h-12 w-full rounded-2xl"
            disabled={!focus.trim() || busy}
            onClick={async () => {
              await onComplete({ cannot_change: cannot, focus_today: focus });
              haptic.success();
              setDone(true);
            }}
          >
            Complete Activity
          </Button>
        </div>
      )}
    </SubScreen>
  );
}

/* Activity 2 — Release What You're Carrying (2 days) ------------------- */

const RELEASE_IDEAS = [
  "A regret I keep replaying",
  "An expectation that no longer fits",
  "A thought that weighs me down",
  "Blame I'm holding onto",
  "A version of the past I wish had happened",
];

export function ReleaseActivity({
  progress,
  onMarkDay,
  onComplete,
  onExit,
  busy,
}: ActivityProps) {
  const [idea, setIdea] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [reflection, setReflection] = useState("");
  const [savedToday, setSavedToday] = useState(false);
  const [done, setDone] = useState(false);
  const days = progress?.day_dates?.length ?? 0;
  const isDayTwo = days >= 1;
  const chosen = idea ?? (custom.trim() || null);

  if (done) {
    return (
      <SubScreen title="Release What You're Carrying">
        <CompletionPanel
          message="You named it, and you loosened your hold on it. That weight is not yours to carry forever."
          onExit={onExit}
        />
      </SubScreen>
    );
  }

  return (
    <SubScreen
      title="Release What You're Carrying"
      description="Identify and gently let go of a thought, regret, or emotional weight, over two different days."
    >
      <p className="soft-card rounded-3xl p-5 text-sm text-muted-foreground">
        Save once on 2 different days. The days do not need to be in a row, and saving twice on
        the same day still counts as one day.
      </p>

      <div className="soft-card mt-5 space-y-4 rounded-3xl p-5">
        {isDayTwo ? (
          <>
            <h2 className="font-semibold">What does it feel like to loosen your hold on it?</h2>
            <Textarea
              value={reflection}
              onChange={(event) => {
                setReflection(event.target.value);
                setSavedToday(false);
              }}
              placeholder="Even a small shift counts."
              className="min-h-28 rounded-2xl"
            />
            <Button
              className="press h-12 w-full rounded-2xl"
              disabled={!reflection.trim() || busy || savedToday}
              onClick={async () => {
                await onMarkDay();
                haptic.success();
                setSavedToday(true);
                setReflection("");
              }}
            >
              {savedToday ? "Saved for today" : "Save today's reflection"}
            </Button>
          </>
        ) : (
          <>
            <h2 className="font-semibold">What are you ready to release?</h2>
            <ul className="flex flex-wrap gap-2">
              {RELEASE_IDEAS.map((item) => (
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
              {savedToday ? "Saved for today" : "Save what I'm releasing"}
            </Button>
          </>
        )}
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

/* Activity 3 — What the Past Taught Me --------------------------------- */

const LESSON_STEPS = [
  {
    key: "myself",
    heading: "What I learned about myself",
    placeholder: "What do you know about yourself now that you didn't before?",
  },
  {
    key: "relationships",
    heading: "What I learned about relationships",
    placeholder: "What does a healthy relationship look like to you now?",
  },
  {
    key: "boundaries",
    heading: "What I learned about my boundaries and needs",
    placeholder: "What will you protect going forward?",
  },
  {
    key: "future",
    heading: "What I want in the future",
    placeholder: "What do you want your next relationship — or next season — to look like?",
  },
] as const;

export function PastTaughtActivity({ progress, onComplete, onExit, busy }: ActivityProps) {
  const saved = progress?.data ?? {};
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      LESSON_STEPS.map((item) => [item.key, (saved[item.key] as string | undefined) ?? ""]),
    ),
  );
  const [done, setDone] = useState(false);

  const current = LESSON_STEPS[step]!;
  const isLast = step === LESSON_STEPS.length - 1;
  const value = answers[current.key] ?? "";

  if (done) {
    return (
      <SubScreen title="What the Past Taught Me">
        <CompletionPanel
          message="Nothing was wasted. You turned the past into understanding."
          onExit={onExit}
        />
      </SubScreen>
    );
  }

  return (
    <SubScreen
      title="What the Past Taught Me"
      description="Reflect on what you learned about yourself, relationships, boundaries, and what you want next."
    >
      <p className="soft-card rounded-3xl p-5 text-sm text-muted-foreground">
        Step {step + 1} of {LESSON_STEPS.length}
      </p>

      <div key={current.key} className="animate-in fade-in slide-in-from-right-4 duration-300">
        <h2 className="mt-6 px-1 font-semibold">{current.heading}</h2>
        <Textarea
          value={value}
          onChange={(event) =>
            setAnswers((prev) => ({ ...prev, [current.key]: event.target.value }))
          }
          placeholder={current.placeholder}
          className="mt-3 min-h-32 rounded-2xl"
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

/* Activity 4 — Choose Your Future (4 days) ----------------------------- */

const FUTURE_ACTIONS = [
  "Do something my future self will thank me for",
  "Say yes to something new",
  "Invest in a goal that's mine",
  "Make plans I'm excited about",
  "Take care of my body or mind",
  "Choose myself in one small decision",
];

export function ChooseFutureActivity({
  progress,
  onMarkDay,
  onComplete,
  onExit,
  busy,
}: ActivityProps) {
  const [action, setAction] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const [savedToday, setSavedToday] = useState(false);
  const [done, setDone] = useState(false);
  const days = progress?.day_dates?.length ?? 0;
  const chosen = action ?? (custom.trim() || null);

  if (done) {
    return (
      <SubScreen title="Choose Your Future">
        <CompletionPanel
          message="Four days of choosing yourself. Your future is already taking shape."
          onExit={onExit}
        />
      </SubScreen>
    );
  }

  return (
    <SubScreen
      title="Choose Your Future"
      description="Each day, complete one small action that represents choosing yourself and moving forward."
    >
      <p className="soft-card rounded-3xl p-5 text-sm text-muted-foreground">
        Log one action on 4 different days. The days do not need to be in a row, and logging
        twice on the same day still counts as one day.
      </p>

      <div className="soft-card mt-5 space-y-4 rounded-3xl p-5">
        <h2 className="font-semibold">Today's step forward</h2>
        <ul className="flex flex-wrap gap-2">
          {FUTURE_ACTIONS.map((item) => (
            <li key={item}>
              <Chip
                label={item}
                active={action === item}
                onClick={() => {
                  haptic.select();
                  setAction(item);
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
            setAction(null);
            setSavedToday(false);
          }}
          placeholder="Or write your own action"
          className="h-12 rounded-2xl"
        />
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="How did it feel to choose yourself? (optional)"
          className="min-h-24 rounded-2xl"
        />
        <Button
          className="press h-12 w-full rounded-2xl"
          disabled={!chosen || busy || savedToday}
          onClick={async () => {
            await onMarkDay();
            haptic.success();
            setSavedToday(true);
            setAction(null);
            setCustom("");
            setNote("");
          }}
        >
          {savedToday ? "Logged for today" : "I did this today"}
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

/* Activity 5 — My Journey Forward -------------------------------------- */

const FORWARD_STEPS = [
  {
    key: "how_far",
    heading: "Celebrate how far you've come",
    placeholder: "What are you proud of surviving, healing, or changing?",
  },
  {
    key: "learned",
    heading: "What this journey taught you",
    placeholder: "The lessons you're keeping.",
  },
  {
    key: "become",
    heading: "Who you have become",
    placeholder: "Describe the person looking back at you now.",
  },
  {
    key: "next_chapter",
    heading: "What your next chapter looks like",
    placeholder: "Write it like a promise to yourself.",
  },
] as const;

export function JourneyForwardActivity({ progress, onComplete, onExit, busy }: ActivityProps) {
  const saved = progress?.data ?? {};
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      FORWARD_STEPS.map((item) => [item.key, (saved[item.key] as string | undefined) ?? ""]),
    ),
  );
  const [done, setDone] = useState(false);

  const current = FORWARD_STEPS[step]!;
  const isLast = step === FORWARD_STEPS.length - 1;
  const value = answers[current.key] ?? "";

  if (done) {
    return (
      <SubScreen title="Journey Complete">
        <CompletionPanel
          message="You completed the entire Journey. You found calm, rested, rediscovered yourself, noticed the good — and now you're moving forward."
          onExit={onExit}
        />
      </SubScreen>
    );
  }

  return (
    <SubScreen
      title="My Journey Forward"
      description="A final reflection on how far you've come, who you've become, and your next chapter."
    >
      <p className="soft-card rounded-3xl p-5 text-sm text-muted-foreground">
        Step {step + 1} of {FORWARD_STEPS.length}
      </p>

      <div key={current.key} className="animate-in fade-in slide-in-from-right-4 duration-300">
        <h2 className="mt-6 px-1 font-semibold">{current.heading}</h2>
        <Textarea
          value={value}
          onChange={(event) =>
            setAnswers((prev) => ({ ...prev, [current.key]: event.target.value }))
          }
          placeholder={current.placeholder}
          className="mt-3 min-h-32 rounded-2xl"
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
            await onComplete({ ...answers, written_at: new Date().toISOString() });
            haptic.success();
            setDone(true);
          }}
        >
          {isLast ? "Complete My Journey" : "Continue"}
        </Button>
      </div>
    </SubScreen>
  );
}
