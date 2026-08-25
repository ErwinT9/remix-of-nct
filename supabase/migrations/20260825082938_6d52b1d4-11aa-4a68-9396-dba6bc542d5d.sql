ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS start_date date NOT NULL DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS time_of_day text NOT NULL DEFAULT 'anytime',
  ADD COLUMN IF NOT EXISTS repeat_type text NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS repeat_days integer[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_paused boolean NOT NULL DEFAULT false;

ALTER TABLE public.routines
  ADD COLUMN IF NOT EXISTS start_date date NOT NULL DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS time_of_day text NOT NULL DEFAULT 'anytime',
  ADD COLUMN IF NOT EXISTS repeat_type text NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS repeat_days integer[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_paused boolean NOT NULL DEFAULT false;

UPDATE public.goals SET start_date = created_at::date WHERE start_date > created_at::date;
UPDATE public.routines SET start_date = created_at::date WHERE start_date > created_at::date;
UPDATE public.routines SET time_of_day = time_category WHERE time_of_day = 'anytime' AND time_category IN ('morning','afternoon','evening','night');

CREATE TABLE IF NOT EXISTS public.routine_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  routine_id uuid NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (routine_id, goal_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.routine_goals TO authenticated;
GRANT ALL ON public.routine_goals TO service_role;

ALTER TABLE public.routine_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own routine goals" ON public.routine_goals;
CREATE POLICY "Users manage their own routine goals"
  ON public.routine_goals FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS routine_goals_routine_idx ON public.routine_goals (routine_id);
CREATE INDEX IF NOT EXISTS routine_goals_goal_idx ON public.routine_goals (goal_id);

DROP TRIGGER IF EXISTS routine_goals_updated_at ON public.routine_goals;
CREATE TRIGGER routine_goals_updated_at BEFORE UPDATE ON public.routine_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.routine_goals (user_id, routine_id, goal_id, sort_order)
SELECT g.user_id, g.routine_id, g.id, g.sort_order
FROM public.goals g
WHERE g.routine_id IS NOT NULL
ON CONFLICT (routine_id, goal_id) DO NOTHING;