-- Extend mentor_applications with the new structured fields
ALTER TABLE public.mentor_applications
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS organization text,
  ADD COLUMN IF NOT EXISTS experience text,
  ADD COLUMN IF NOT EXISTS expertise_areas text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS motivation_text text,
  ADD COLUMN IF NOT EXISTS value_text text,
  ADD COLUMN IF NOT EXISTS mentoring_style text,
  ADD COLUMN IF NOT EXISTS availability text,
  ADD COLUMN IF NOT EXISTS cv_url text,
  ADD COLUMN IF NOT EXISTS portfolio_link text,
  ADD COLUMN IF NOT EXISTS admin_feedback text;

-- Trigger to keep updated_at fresh on update
DROP TRIGGER IF EXISTS update_mentor_applications_updated_at ON public.mentor_applications;
CREATE TRIGGER update_mentor_applications_updated_at
BEFORE UPDATE ON public.mentor_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Allow applicants to update their own pending application (e.g., re-upload CV before review)
DROP POLICY IF EXISTS "Users update own pending application" ON public.mentor_applications;
CREATE POLICY "Users update own pending application"
ON public.mentor_applications
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

-- Storage bucket for CVs (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('mentor-cvs', 'mentor-cvs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: each user manages files under a folder named after their user id
DROP POLICY IF EXISTS "Users upload own CV" ON storage.objects;
CREATE POLICY "Users upload own CV"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'mentor-cvs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users view own CV" ON storage.objects;
CREATE POLICY "Users view own CV"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'mentor-cvs'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);

DROP POLICY IF EXISTS "Users update own CV" ON storage.objects;
CREATE POLICY "Users update own CV"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'mentor-cvs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users delete own CV" ON storage.objects;
CREATE POLICY "Users delete own CV"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'mentor-cvs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);