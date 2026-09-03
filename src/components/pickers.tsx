import { useMemo, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toLocalDateValue } from "@/lib/datetime";
import { cn } from "@/lib/utils";

/**
 * In-app date & time pickers.
 *
 * Native <input type="date"> / <input type="time"> render the Android WebView's
 * own dialog, which ignores the app theme (white sheets, low-contrast digits in
 * dark mode). These components keep the exact same string value formats
 * ("YYYY-MM-DD" and 24h "HH:MM") so stored data is untouched, while rendering
 * fully themed UI that works in light and dark mode on every Android version.
 * All conversions go through local Date getters, so the device timezone is used.
 */

/** "YYYY-MM-DD" -> local Date (no UTC shift). */
export function dateValueToDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDateLabel(value: string | null | undefined) {
  const date = dateValueToDate(value);
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type DatePickerProps = {
  /** "YYYY-MM-DD" in the device's local calendar, or null/"" when unset. */
  value: string | null;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  id?: string;
  placeholder?: string;
  invalid?: boolean;
  className?: string;
  /** Visual size of the trigger. */
  variant?: "field" | "compact" | "ghost";
};

export function DatePickerField({
  value,
  onChange,
  min,
  max,
  id,
  placeholder = "Pick a date",
  invalid,
  className,
  variant = "field",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = dateValueToDate(value);
  const minDate = dateValueToDate(min);
  const maxDate = dateValueToDate(max);

  const disabled = useMemo(() => {
    const rules: Array<{ before?: Date; after?: Date }> = [];
    if (minDate) rules.push({ before: minDate });
    if (maxDate) rules.push({ after: maxDate });
    return rules.length ? rules : undefined;
  }, [minDate?.getTime(), maxDate?.getTime()]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-invalid={invalid ?? false}
          className={cn(
            "press flex w-full min-w-0 items-center gap-2 text-left text-foreground",
            variant === "field" &&
              "h-13 rounded-2xl border border-input bg-background px-3 text-base aria-[invalid=true]:border-destructive",
            variant === "compact" &&
              "h-10 rounded-2xl border border-input bg-background px-3 text-sm",
            variant === "ghost" &&
              "h-auto justify-center bg-transparent text-xs text-muted-foreground",
            className,
          )}
        >
          {variant !== "ghost" ? (
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          ) : null}
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value ? formatDateLabel(value) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-auto border-border bg-popover p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? new Date()}
          {...(disabled ? { disabled } : {})}
          onSelect={(date) => {
            if (!date) return;
            onChange(toLocalDateValue(date));
            setOpen(false);
          }}
          className="pointer-events-auto p-3"
        />
      </PopoverContent>
    </Popover>
  );
}

/** 24h "HH:MM" -> { hour12, minute, meridiem } */
function parseTimeValue(value: string | null | undefined) {
  const [rawHour, rawMinute] = (value ?? "").split(":").map(Number);
  const hours = Number.isFinite(rawHour) ? Math.min(23, Math.max(0, rawHour)) : 9;
  const minute = Number.isFinite(rawMinute) ? Math.min(59, Math.max(0, rawMinute)) : 0;
  return {
    hour12: hours % 12 === 0 ? 12 : hours % 12,
    minute,
    meridiem: (hours >= 12 ? "PM" : "AM") as "AM" | "PM",
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

export function partsToTimeValue(hour12: number, minute: number, meridiem: "AM" | "PM") {
  const hours = (hour12 % 12) + (meridiem === "PM" ? 12 : 0);
  return `${pad(hours)}:${pad(minute)}`;
}

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

type TimePickerProps = {
  /** 24h "HH:MM" local time, or null when unset. */
  value: string | null;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  size?: "md" | "sm";
  hourDisabled?: (hour24: number) => boolean;
  minuteDisabled?: (minute: number) => boolean;
  meridiemDisabled?: (meridiem: "AM" | "PM") => boolean;
};

/** Hour : Minute : AM/PM selector rendered with themed in-app menus. */
export function TimePickerField({
  value,
  onChange,
  id,
  className,
  size = "md",
  hourDisabled,
  minuteDisabled,
  meridiemDisabled,
}: TimePickerProps) {
  const parts = parseTimeValue(value);
  const triggerClass = cn(
    "min-w-0 flex-1 rounded-2xl border-input bg-background text-foreground",
    size === "md" ? "h-13 text-base" : "h-10 text-sm",
  );

  const emit = (patch: Partial<ReturnType<typeof parseTimeValue>>) => {
    const next = { ...parts, ...patch };
    onChange(partsToTimeValue(next.hour12, next.minute, next.meridiem));
  };

  const to24 = (hour12: number, meridiem: "AM" | "PM") =>
    (hour12 % 12) + (meridiem === "PM" ? 12 : 0);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select
        value={String(parts.hour12)}
        onValueChange={(next) => emit({ hour12: Number(next) })}
      >
        <SelectTrigger id={id} aria-label="Hour" className={triggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {HOURS.map((hour) => (
            <SelectItem
              key={hour}
              value={String(hour)}
              disabled={hourDisabled?.(to24(hour, parts.meridiem)) ?? false}
            >
              {pad(hour)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span aria-hidden className="text-lg font-medium text-muted-foreground">
        :
      </span>
      <Select value={String(parts.minute)} onValueChange={(next) => emit({ minute: Number(next) })}>
        <SelectTrigger aria-label="Minute" className={triggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {MINUTES.map((minute) => (
            <SelectItem
              key={minute}
              value={String(minute)}
              disabled={minuteDisabled?.(minute) ?? false}
            >
              {pad(minute)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={parts.meridiem}
        onValueChange={(next) => emit({ meridiem: next as "AM" | "PM" })}
      >
        <SelectTrigger aria-label="AM or PM" className={triggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM" disabled={meridiemDisabled?.("AM") ?? false}>
            AM
          </SelectItem>
          <SelectItem value="PM" disabled={meridiemDisabled?.("PM") ?? false}>
            PM
          </SelectItem>
        </SelectContent>
      </Select>
      <Button type="button" variant="ghost" size="icon" tabIndex={-1} aria-hidden className="hidden">
        <Clock className="size-4" />
      </Button>
    </div>
  );
}
