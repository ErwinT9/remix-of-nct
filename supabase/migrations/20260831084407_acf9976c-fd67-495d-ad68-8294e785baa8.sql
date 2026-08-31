ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS reminder_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_time text,
  ADD COLUMN IF NOT EXISTS reminder_timezone text;

ALTER TABLE public.routines
  ADD COLUMN IF NOT EXISTS reminder_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_time text,
  ADD COLUMN IF NOT EXISTS reminder_timezone text;