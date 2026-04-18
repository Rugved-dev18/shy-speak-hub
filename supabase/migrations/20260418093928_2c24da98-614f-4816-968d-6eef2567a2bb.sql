
-- 1. Roles enum + user_roles table + has_role function
CREATE TYPE public.app_role AS ENUM ('admin', 'mentor', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Roles viewable by everyone"
ON public.user_roles FOR SELECT
USING (true);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Mentor applications
CREATE TABLE public.mentor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bio TEXT NOT NULL,
  expertise TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.mentor_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own application"
ON public.mentor_applications FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own application"
ON public.mentor_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update applications"
ON public.mentor_applications FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER mentor_applications_updated_at
BEFORE UPDATE ON public.mentor_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Bootstrap: first non-anonymous (Google) user becomes admin
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip anonymous users
  IF NEW.is_anonymous THEN
    RETURN NEW;
  END IF;
  -- If no admins exist yet, make this user admin
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_bootstrap_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.bootstrap_first_admin();

-- 4. Sessions: scheduling + video room + tighter RLS
ALTER TABLE public.sessions
  ADD COLUMN scheduled_at TIMESTAMPTZ,
  ADD COLUMN ended_at TIMESTAMPTZ,
  ADD COLUMN description TEXT,
  ADD COLUMN room_name TEXT NOT NULL DEFAULT ('shysc-' || replace(gen_random_uuid()::text, '-', ''));

CREATE UNIQUE INDEX sessions_room_name_idx ON public.sessions(room_name);

-- Replace permissive INSERT policy with mentor/admin only
DROP POLICY IF EXISTS "Authenticated users create sessions" ON public.sessions;

CREATE POLICY "Mentors and admins create sessions"
ON public.sessions FOR INSERT
WITH CHECK (
  auth.uid() = creator_id
  AND (public.has_role(auth.uid(), 'mentor') OR public.has_role(auth.uid(), 'admin'))
);

-- Keep existing "Creators update own sessions" and "Sessions viewable by everyone"
