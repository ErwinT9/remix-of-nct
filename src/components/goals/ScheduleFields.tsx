import { Bell, CalendarDays } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  dayKey,
  defaultReminderTime,
  deviceTimezoneName,
  formatTime12,
  REMINDER_PRESETS,
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
  reminder_enabled: boolean;
  /** Local "HH:MM" (24h). Null while reminders are off. */
  reminder_time: string | null;
  reminder_timezone: string | null;
};

export function defaultSchedule(timeOfDay = "anytime"): ScheduleValue {
  return {
    start_date: dayKey(),
    end_date: null,
    time_of_day: timeOfDay,
    repeat_type: "none",
    repeat_days: [],
    reminder_enabled: false,
    reminder_time: null,
    reminder_timezone: null,
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

      <div className="space-y-2 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="remind-me" className="flex items-center gap-2">
            <Bell className="size-4 text-primary" aria-hidden /> Remind me
          </Label>
          <Switch
            id="remind-me"
            checked={value.reminder_enabled}
            onCheckedChange={(checked) =>
              patch({
                reminder_enabled: checked,
                reminder_time: checked
                  ? (value.reminder_time ?? defaultReminderTime(value.time_of_day))
                  : null,
                reminder_timezone: checked ? deviceTimezoneName() : null,
              })
            }
          />
        </div>

        {value.reminder_enabled ? (
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap gap-2">
              {REMINDER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={chip(value.reminder_time === preset.time)}
                  onClick={() =>
                    patch({ reminder_time: preset.time, reminder_timezone: deviceTimezoneName() })
                  }
                >
                  {preset.label} · {formatTime12(preset.time)}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 rounded-2xl border border-border px-3 py-2">
              <span className="text-xs text-muted-foreground">Exact time</span>
              <Input
                type="time"
                step={60}
                value={value.reminder_time ?? ""}
                onChange={(event) =>
                  onChange({
                    ...value,
                    reminder_time: event.target.value || null,
                    reminder_timezone: deviceTimezoneName(),
                  })
                }
                className="h-9 flex-1 border-0 bg-transparent p-0 text-right text-sm shadow-none focus-visible:ring-0"
              />
            </label>
            <p className="text-xs text-muted-foreground">
              {value.reminder_time
                ? `We'll send one gentle nudge at ${formatTime12(value.reminder_time)}, following your schedule above.`
                : "Pick a time for your reminder."}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
