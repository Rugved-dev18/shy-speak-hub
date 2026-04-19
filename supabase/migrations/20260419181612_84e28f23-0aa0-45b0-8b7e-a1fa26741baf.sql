
-- 1) user_roles: restrict SELECT to self + admins
DROP POLICY IF EXISTS "Roles viewable by everyone" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) questions: split UPDATE so authors can only edit text/tag,
--    moderators/session creators control is_pinned/is_answered/upvotes
DROP POLICY IF EXISTS "Authors update own questions" ON public.questions;

CREATE OR REPLACE FUNCTION public.is_session_creator(_user_id uuid, _session_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.sessions WHERE id = _session_id AND creator_id = _user_id)
$$;

-- Trigger to lock down which columns each role can change
CREATE OR REPLACE FUNCTION public.enforce_question_update_rules()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_mod boolean;
  is_author boolean;
BEGIN
  is_mod := public.has_role(auth.uid(), 'admin')
         OR public.has_role(auth.uid(), 'mentor')
         OR public.is_session_creator(auth.uid(), NEW.session_id);
  is_author := (auth.uid() = OLD.user_id);

  IF is_mod THEN
    RETURN NEW;
  END IF;

  IF is_author THEN
    -- Authors may only edit text/tag; moderation fields must remain unchanged
    IF NEW.is_pinned IS DISTINCT FROM OLD.is_pinned
       OR NEW.is_answered IS DISTINCT FROM OLD.is_answered
       OR NEW.upvotes IS DISTINCT FROM OLD.upvotes
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.session_id IS DISTINCT FROM OLD.session_id
       OR NEW.author_name IS DISTINCT FROM OLD.author_name THEN
      RAISE EXCEPTION 'Authors cannot modify moderation fields';
    END IF;
    RETURN NEW;
  END IF;

  -- Allow upvote-only updates by any authenticated user
  IF auth.uid() IS NOT NULL
     AND NEW.upvotes = OLD.upvotes + 1
     AND NEW.text = OLD.text
     AND NEW.tag = OLD.tag
     AND NEW.is_pinned = OLD.is_pinned
     AND NEW.is_answered = OLD.is_answered
     AND NEW.user_id IS NOT DISTINCT FROM OLD.user_id
     AND NEW.session_id IS NOT DISTINCT FROM OLD.session_id
     AND NEW.author_name = OLD.author_name THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Not allowed to update this question';
END;
$$;

DROP TRIGGER IF EXISTS questions_enforce_update ON public.questions;
CREATE TRIGGER questions_enforce_update
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_question_update_rules();

CREATE POLICY "Authenticated can update questions (rules enforced)" ON public.questions
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3) profiles: hide user_id from public; only authenticated users can read profiles
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- 4) discussions / discussion_messages: require authentication to post
DROP POLICY IF EXISTS "Anyone can create discussions" ON public.discussions;
CREATE POLICY "Authenticated create discussions" ON public.discussions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (creator_id IS NULL OR creator_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can post messages" ON public.discussion_messages;
CREATE POLICY "Authenticated post messages" ON public.discussion_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

-- 5) questions INSERT: require auth and lock user_id
DROP POLICY IF EXISTS "Anyone can ask questions" ON public.questions;
CREATE POLICY "Authenticated ask questions" ON public.questions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

-- 6) Realtime: restrict channel subscriptions to authenticated users
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can use realtime" ON realtime.messages;
CREATE POLICY "Authenticated can use realtime" ON realtime.messages
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can broadcast" ON realtime.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
