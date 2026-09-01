CREATE TABLE public.bug_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  client_ref text NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  description text NOT NULL,
  expected_behavior text,
  reproduction_steps text,
  severity text NOT NULL DEFAULT 'medium',
  platform text,
  app_version text,
  device_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  os_version text,
  network_status text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_ref)
);

GRANT SELECT, INSERT ON public.bug_reports TO authenticated;
GRANT ALL ON public.bug_reports TO service_role;

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own bug reports"
  ON public.bug_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bug reports"
  ON public.bug_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX bug_reports_user_created_idx ON public.bug_reports (user_id, created_at DESC);

CREATE TRIGGER bug_reports_updated_at
  BEFORE UPDATE ON public.bug_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users manage own bug attachments read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'bug-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users manage own bug attachments insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bug-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users manage own bug attachments delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'bug-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);