import { Bell } from "lucide-react";

import { DatePickerField, TimePickerField } from "@/components/pickers";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  dayKey,
  deviceTimezoneName,
  formatTime12,
  longDay,
  REPEAT_OPTIONS,
  shiftDay,
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
        <DatePickerField
          variant="compact"
          value={value.start_date}
          onChange={(next) => onChange({ ...value, start_date: next })}
        />
        <p className="text-xs text-muted-foreground">Scheduled for {longDay(value.start_date)}</p>
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
              <DatePickerField
                variant="compact"
                className="flex-1"
                placeholder="Pick an end date"
                value={value.end_date}
                min={value.start_date}
                onChange={(next) => onChange({ ...value, end_date: next || null })}
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
                reminder_time: checked ? (value.reminder_time ?? "09:00") : null,
                reminder_timezone: checked ? deviceTimezoneName() : null,
              })
            }
          />
        </div>

        {value.reminder_enabled ? (
          <div className="space-y-2 pt-1">
            <div className="space-y-2 rounded-2xl border border-border px-3 py-2">
              <span className="text-xs text-muted-foreground">Exact time</span>
              <TimePickerField
                size="sm"
                value={value.reminder_time ?? "09:00"}
                onChange={(next) =>
                  onChange({
                    ...value,
                    reminder_time: next || null,
                    reminder_timezone: deviceTimezoneName(),
                  })
                }
              />
            </div>
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
