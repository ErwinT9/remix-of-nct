import { useEffect, useMemo, useState } from "react";

import { DatePickerField, TimePickerField, partsToTimeValue } from "@/components/pickers";
import {
  clampToNow,
  formatLocalDateTime,
  localPartsToISO,
  parseTimestamp,
  toLocalDateValue,
  toLocalParts,
} from "@/lib/datetime";
import { cn } from "@/lib/utils";

type Props = {
  /** Stored UTC ISO timestamp, or null when nothing is picked yet. */
  value: string | null;
  onChange: (iso: string) => void;
  /** Prevent picking a future calendar day. */
  disableFuture?: boolean;
  id?: string;
  invalid?: boolean;
  className?: string;
};


/**
 * Date + 12-hour time picker that always works in the device's local
 * timezone and emits a UTC ISO string.
 */
export function DateTimeField({ value, onChange, disableFuture, id, invalid, className }: Props) {
  // Ticks so "now" (and therefore which options are selectable) stays live.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!disableFuture) return;
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, [disableFuture]);

  const parts = useMemo(() => toLocalParts(parseTimestamp(value) ?? new Date()), [value]);

  const isToday = disableFuture && parts.dateValue === toLocalDateValue(now);
  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  const selectedHour24 = (parts.hour12 % 12) + (parts.meridiem === "PM" ? 12 : 0);

  const hourDisabled = (hour: number) =>
    isToday && (hour % 12) + (parts.meridiem === "PM" ? 12 : 0) > nowHour;
  const minuteDisabled = (minute: number) =>
    isToday && selectedHour24 === nowHour && minute > nowMinute;

  const emit = (patch: Partial<ReturnType<typeof toLocalParts>>) => {
    const next = { ...parts, ...patch };
    const iso = localPartsToISO(next.dateValue, next.hour12, next.minute, next.meridiem);
    if (!iso) return;
    // Hard guard: a manually typed/entered future moment is clamped to now.
    onChange(disableFuture ? clampToNow(iso) : iso);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <DatePickerField
        id={id}
        value={parts.dateValue}
        invalid={invalid ?? false}
        {...(disableFuture ? { max: toLocalDateValue() } : {})}
        onChange={(dateValue) => emit({ dateValue })}
      />
      <TimePickerField
        value={partsToTimeValue(parts.hour12, parts.minute, parts.meridiem)}
        onChange={(next) => {
          const [hour24, minute] = next.split(":").map(Number);
          const hours = hour24 ?? 0;
          emit({
            hour12: hours % 12 === 0 ? 12 : hours % 12,
            minute: minute ?? 0,
            meridiem: hours >= 12 ? "PM" : "AM",
          });
        }}
        hourDisabled={(hour24) => hourDisabled(hour24 % 12 === 0 ? 12 : hour24 % 12)}
        minuteDisabled={minuteDisabled}
        meridiemDisabled={(meridiem) => meridiem === "PM" && Boolean(isToday) && nowHour < 12}
      />
      {value ? <p className="text-xs text-muted-foreground">{formatLocalDateTime(value)}</p> : null}
    </div>
  );
}
