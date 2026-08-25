import { CalendarDays } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  dayKey,
  longDay,
  REPEAT_OPTIONS,
  shiftDay,
  TIME_CATEGORIES,
  WEEKDAY_LABELS,
  type RepeatType,
} from "@/lib/goals";
import { haptic } from "@/lib/native/haptics";
import { cn } from "@/lib/utils";

export type ScheduleValue = {
  start_date: string;
  end_date: string | null;
  time_of_day: string;
  repeat_type: RepeatType;
  repeat_days: number[];
};

export function defaultSchedule(timeOfDay = "anytime"): ScheduleValue {
  return {
    start_date: dayKey(),
    end_date: null,
    time_of_day: timeOfDay,
    repeat_type: "none",
    repeat_days: [],
  };
}

const chip = (active: boolean) =>
  cn(
    "press rounded-full border px-3 py-1.5 text-xs font-medium",
    active ? "border-primary bg-muted" : "border-border",
  );

/** Shared date / time-of-day / repeat editor for goals and routines. */
export function ScheduleFields({
  value,
  onChange,
  startLabel = "When?",
}: {
  value: ScheduleValue;
  onChange: (next: ScheduleValue) => void;
  startLabel?: string;
}) {
  const today = dayKey();
  const tomorrow = shiftDay(today, 1);
  const patch = (next: Partial<ScheduleValue>) => {
    haptic.select();
    onChange({ ...value, ...next });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>📅 {startLabel}</Label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={chip(value.start_date === today)}
            onClick={() => patch({ start_date: today })}
          >
            Today
          </button>
          <button
            type="button"
            className={chip(value.start_date === tomorrow)}
            onClick={() => patch({ start_date: tomorrow })}
          >
            Tomorrow
          </button>
        </div>
        <label className="flex items-center gap-2 rounded-2xl border border-border px-3 py-2">
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="sr-only">Choose a date</span>
          <Input
            type="date"
            value={value.start_date}
            onChange={(event) => {
              if (event.target.value) onChange({ ...value, start_date: event.target.value });
            }}
            className="h-9 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
          />
        </label>
        <p className="text-xs text-muted-foreground">Scheduled for {longDay(value.start_date)}</p>
      </div>

      <div className="space-y-2">
        <Label>🕒 Time of Day</Label>
        <div className="flex flex-wrap gap-2">
          {TIME_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={chip(value.time_of_day === item.id)}
              onClick={() => patch({ time_of_day: item.id })}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>🔄 Repeat</Label>
        <div className="flex flex-wrap gap-2">
          {REPEAT_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={chip(value.repeat_type === item.id)}
              onClick={() => patch({ repeat_type: item.id })}
            >
              {item.label}
            </button>
          ))}
        </div>

        {value.repeat_type === "weekly" ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {WEEKDAY_LABELS.map((label, index) => {
              const active = value.repeat_days.includes(index);
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={active}
                  className={chip(active)}
                  onClick={() =>
                    patch({
                      repeat_days: active
                        ? value.repeat_days.filter((day) => day !== index)
                        : [...value.repeat_days, index],
                    })
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : null}

        {value.repeat_type !== "none" ? (
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs text-muted-foreground">Ends</Label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={chip(!value.end_date)}
                onClick={() => patch({ end_date: null })}
              >
                Never
              </button>
              <Input
                type="date"
                value={value.end_date ?? ""}
                min={value.start_date}
                onChange={(event) => onChange({ ...value, end_date: event.target.value || null })}
                className="h-10 w-auto flex-1 rounded-2xl text-sm"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
