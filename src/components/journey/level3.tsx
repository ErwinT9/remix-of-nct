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

/** Three free-text lines used by the multi-day strength activities. */
function ThreeLines({
  values,
  onChange,
  placeholders,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholders: string[];
}) {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((index) => (
        <Input
          key={index}
          value={values[index] ?? ""}
          onChange={(event) => {
            const next = [...values];
            next[index] = event.target.value;
            onChange(next);
          }}
          placeholder={placeholders[index] ?? ""}
          className="h-12 rounded-2xl"
        />
      ))}
    </div>
  );
}

/* Activity 1 — Who Am I Beyond the Relationship? ---------------------- */

const TRAITS = [
  "Kind",
  "Curious",
  "Loyal",
  "Creative",
  "Patient",
  "Honest",
  "Funny",
  "Determined",
  "Thoughtful",
  "Brave",
];

const VALUES = [
  "Honesty",
  "Freedom",
  "Family",
  "Growth",
  "Peace",
  "Adventure",
  "Health",
  "Creativity",
  "Independence",
];

export function WhoAmIActivity({ progress, onComplete, onExit, busy }: ActivityProps) {
  const saved = progress?.data ?? {};
  const [step, setStep] = useState(0);
  const [traits, setTraits] = useState<string[]>((saved["traits"] as string[] | undefined) ?? []);
  const [values, setValues] = useState<string[]>((saved["values"] as string[] | undefined) ?? []);
  const [interests, setInterests] = useState((saved["interests"] as string | undefined) ?? "");
  const [unique, setUnique] = useState((saved["unique"] as string | undefined) ?? "");
  const [done, setDone] = useState(false);

  const toggle = (list: string[], setList: (next: string[]) => void, item: string) => {
    haptic.select();
    setList(list.includes(item) ? list.filter((value) => value !== item) : [...list, item]);
  };

  if (done) {
    return (
      <SubScreen title="Who Am I Beyond the Relationship?">
        <CompletionPanel
          message="You are a whole person on your own — and you just put that into words."
          onExit={onExit}
        />
      </SubScreen>
    );
  }

  return (
    <SubScreen
      title="Who Am I Beyond the Relationship?"
      description="Reflect on your personality, values, interests and the qualities that make you uniquely you."
    >
      {step === 0 ? (
        <div className="animate-in fade-in duration-300">
          <h2 className="px-1 font-semibold">Which of these feel like you?</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {TRAITS.map((item) => (
              <li key={item}>
                <Chip
                  label={item}
                  active={traits.includes(item)}
                  onClick={() => toggle(traits, setTraits, item)}
                />
              </li>
            ))}
          </ul>
          <Button
            className="press mt-8 h-12 w-full rounded-2xl"
            disabled={traits.length === 0}
            onClick={() => {
              haptic.light();
              setStep(1);
            }}
          >
            Continue
          </Button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="px-1 font-semibold">What matters most to you?</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {VALUES.map((item) => (
              <li key={item}>
                <Chip
                  label={item}
                  active={values.includes(item)}
                  onClick={() => toggle(values, setValues, item)}
                />
              </li>
            ))}
          </ul>
          <Button
            className="press mt-8 h-12 w-full rounded-2xl"
            disabled={values.length === 0}
            onClick={() => {
              haptic.light();
              setStep(2);
            }}
          >
            Continue
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="px-1 font-semibold">
            What do you enjoy doing that has nothing to do with anyone else?
          </h2>
          <Textarea
            value={interests}
            onChange={(event) => setInterests(event.target.value)}
            placeholder="Interests, hobbies, small things that make a day better."
            className="mt-3 min-h-28 rounded-2xl"
          />
          <Button
            className="press mt-8 h-12 w-full rounded-2xl"
            disabled={!interests.trim()}
            onClick={() => {
              haptic.light();
              setStep(3);
            }}
          >
            Continue
          </Button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="px-1 font-semibold">What makes you uniquely you?</h2>
          <Textarea
            value={unique}
            onChange={(event) => setUnique(event.target.value)}
            placeholder="Something only you would say about yourself."
            className="mt-3 min-h-28 rounded-2xl"
          />
          <Button
            className="press mt-8 h-12 w-full rounded-2xl"
            disabled={!unique.trim() || busy}
            onClick={async () => {
              await onComplete({ traits, values, interests, unique });
              haptic.success();
              setDone(true);
            }}
          >
            Complete Activity
          </Button>
        </div>
      ) : null}
    </SubScreen>
  );
}

/* Activity 2 — See Your Strengths (2 days) ---------------------------- */

export function SeeStrengthsActivity({
  progress,
  onMarkDay,
  onComplete,
  onExit,
  busy,
}: ActivityProps) {
  const [lines, setLines] = useState<string[]>(["", "", ""]);
  const [savedToday, setSavedToday] = useState(false);
  const [done, setDone] = useState(false);
  const days = progress?.day_dates?.length ?? 0;
  const filled = lines.filter((line) => line.trim()).length;

  if (done) {
    return (
      <SubScreen title="See Your Strengths">
        <CompletionPanel
          message="You named what is good in you — more than once. That is how self-trust rebuilds."
          onExit={onExit}
        />
      </SubScreen>
    );
  }

  return (
    <SubScreen
      title="See Your Strengths"
      description="Notice the qualities you appreciate about yourself, over two different days."
    >
      <p className="soft-card rounded-3xl p-5 text-sm text-muted-foreground">
        Write at least 3 things on 2 different days. The days do not need to be in a row, and
        saving twice on the same day still counts as one day.
      </p>

      <div className="soft-card mt-5 space-y-4 rounded-3xl p-5">
        <h2 className="font-semibold">
          {days === 0
            ? "3 qualities you appreciate about yourself"
            : "3 more strengths or moments you are proud of"}
        </h2>
        <ThreeLines
          values={lines}
          onChange={(next) => {
            setLines(next);
            setSavedToday(false);
          }}
          placeholders={
            days === 0
              ? ["Something you like about how you treat people", "A quality you rely on", "Something you're good at"]
              : ["A moment you handled well", "A strength others see in you", "Something you're proud of"]
          }
        />
        <Button
          className="press h-12 w-full rounded-2xl"
          disabled={filled < 3 || busy || savedToday}
          onClick={async () => {
            await onMarkDay();
            haptic.success();
            setSavedToday(true);
            setLines(["", "", ""]);
          }}
        >
          {savedToday ? "Saved for today" : "Save today's strengths"}
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

/* Activity 3 — Do Something Just for You ------------------------------ */

const JOY_IDEAS = [
  "Take a walk somewhere new",
  "Cook a meal I love",
  "Watch a favourite film",
  "Play music loudly",
  "Read for an hour",
  "Draw or write something",
  "Take myself out for coffee",
];

export function JustForYouActivity({ progress, onComplete, onExit, busy }: ActivityProps) {
  const saved = progress?.data ?? {};
  const [choice, setChoice] = useState<string | null>((saved["choice"] as string | undefined) ?? null);
  const [custom, setCustom] = useState("");
  const [reflection, setReflection] = useState("");
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const chosen = choice ?? (custom.trim() || null);

  if (done) {
    return (
      <SubScreen title="Do Something Just for You">
        <CompletionPanel
          message="You did something purely for yourself. No approval needed — that was the point."
          onExit={onExit}
        />
      </SubScreen>
    );
  }

  return (
    <SubScreen
      title="Do Something Just for You"
      description="Choose and complete a small thing you genuinely enjoy, without seeking anyone else's approval."
    >
      {step === 0 ? (
        <div className="animate-in fade-in duration-300">
          <h2 className="px-1 font-semibold">What would you actually enjoy?</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {JOY_IDEAS.map((item) => (
              <li key={item}>
                <Chip
                  label={item}
                  active={choice === item}
                  onClick={() => {
                    haptic.select();
                    setChoice(item);
                    setCustom("");
                  }}
                />
              </li>
            ))}
          </ul>
          <Input
            value={custom}
            onChange={(event) => {
              setCustom(event.target.value);
              setChoice(null);
            }}
            placeholder="Or write your own"
            className="mt-4 h-12 rounded-2xl"
          />
          <Button
            className="press mt-8 h-12 w-full rounded-2xl"
            disabled={!chosen}
            onClick={() => {
              haptic.light();
              setStep(1);
            }}
          >
            I'll do this
          </Button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <p className="soft-card rounded-3xl p-5 text-sm text-muted-foreground">
            Go and do it whenever you're ready — this screen will wait for you. Come back once
            you've finished.
          </p>
          <h2 className="mt-6 px-1 font-semibold">How did it feel to do this just for you?</h2>
          <Textarea
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
            placeholder="A sentence or two is enough."
            className="mt-3 min-h-28 rounded-2xl"
          />
          <Button
            className="press mt-8 h-12 w-full rounded-2xl"
            disabled={!reflection.trim() || busy}
            onClick={async () => {
              await onComplete({ choice: chosen, reflection });
              haptic.success();
              setDone(true);
            }}
          >
            I did it — Complete Activity
          </Button>
        </div>
      )}
    </SubScreen>
  );
}

/* Activity 4 — Build Your Confidence (4 days) ------------------------- */

const CONFIDENCE_IDEAS = [
  "Handle something I'd been avoiding",
  "Go somewhere alone",
  "Say no to something",
  "Learn one new thing",
  "Finish a small task fully",
  "Ask for what I need",
];

export function BuildConfidenceActivity({
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
      <SubScreen title="Build Your Confidence">
        <CompletionPanel
          message="Four days of small, capable actions. That's not luck — that's you."
          onExit={onExit}
        />
      </SubScreen>
    );
  }

  return (
    <SubScreen
      title="Build Your Confidence"
      description="Each day, complete one small action that makes you feel capable, independent or proud."
    >
      <p className="soft-card rounded-3xl p-5 text-sm text-muted-foreground">
        Log one action on 4 different days. The days do not need to be in a row, and logging twice
        on the same day still counts as one day.
      </p>

      <div className="soft-card mt-5 space-y-4 rounded-3xl p-5">
        <h2 className="font-semibold">Today's small action</h2>
        <ul className="flex flex-wrap gap-2">
          {CONFIDENCE_IDEAS.map((item) => (
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
          placeholder="How did it make you feel? (optional)"
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

/* Activity 5 — My New Self-Portrait ----------------------------------- */

const PORTRAIT_STEPS = [
  {
    key: "qualities",
    heading: "The qualities you carry with you now",
    placeholder: "What is true about you today?",
  },
  {
    key: "values",
    heading: "The values you want to live by",
    placeholder: "What will guide your choices from here?",
  },
  {
    key: "boundaries",
    heading: "The boundaries you're keeping",
    placeholder: "What will you no longer accept?",
  },
  {
    key: "dreams",
    heading: "The dreams you're moving toward",
    placeholder: "What are you looking forward to?",
  },
  {
    key: "wants",
    heading: "What you now want for yourself",
    placeholder: "Write it to the person you are becoming.",
  },
] as const;

export function SelfPortraitActivity({ progress, onComplete, onExit, busy }: ActivityProps) {
  const saved = progress?.data ?? {};
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      PORTRAIT_STEPS.map((item) => [item.key, (saved[item.key] as string | undefined) ?? ""]),
    ),
  );
  const [done, setDone] = useState(false);

  const current = PORTRAIT_STEPS[step]!;
  const isLast = step === PORTRAIT_STEPS.length - 1;
  const value = answers[current.key] ?? "";

  if (done) {
    return (
      <SubScreen title="Level 3 Complete">
        <CompletionPanel
          message="You completed Level 3: Rediscover Yourself. Your self-portrait is saved for whenever you need reminding."
          onExit={onExit}
        />
      </SubScreen>
    );
  }

  return (
    <SubScreen
      title="My New Self-Portrait"
      description="A final reflection on the person you are becoming."
    >
      <p className="soft-card rounded-3xl p-5 text-sm text-muted-foreground">
        Step {step + 1} of {PORTRAIT_STEPS.length}
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
          {isLast ? "Complete Activity" : "Continue"}
        </Button>
      </div>
    </SubScreen>
  );
}
