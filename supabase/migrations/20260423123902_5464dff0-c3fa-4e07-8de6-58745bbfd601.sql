-- Create tasks table for mentor-created group tasks
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt TEXT NOT NULL,
  time_limit INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view tasks
CREATE POLICY "Tasks viewable by everyone"
  ON public.tasks FOR SELECT
  USING (true);

-- Only mentors/admins can create
CREATE POLICY "Mentors and admins create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND (public.has_role(auth.uid(), 'mentor') OR public.has_role(auth.uid(), 'admin'))
  );

-- Creators can update their own; admins can update any
CREATE POLICY "Creators or admins update tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = creator_id OR public.has_role(auth.uid(), 'admin'));

-- Creators or admins can delete
CREATE POLICY "Creators or admins delete tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = creator_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tasks_created_at ON public.tasks(created_at DESC);