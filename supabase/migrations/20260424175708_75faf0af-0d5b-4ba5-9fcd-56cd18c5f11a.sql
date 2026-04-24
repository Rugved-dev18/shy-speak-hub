CREATE OR REPLACE FUNCTION public.recompute_profile_counters(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q_count int;
  t_count int;
  s_count int;
  streak int;
  confidence int;
BEGIN
  IF _user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COUNT(*) INTO q_count FROM public.questions WHERE user_id = _user_id;
  SELECT COUNT(*) INTO t_count FROM public.task_responses WHERE user_id = _user_id;
  SELECT COUNT(DISTINCT session_id) INTO s_count
    FROM public.questions
    WHERE user_id = _user_id AND session_id IS NOT NULL;

  WITH activity_days AS (
    SELECT DISTINCT (created_at AT TIME ZONE 'UTC')::date AS d
    FROM public.questions
    WHERE user_id = _user_id
    UNION
    SELECT DISTINCT (created_at AT TIME ZONE 'UTC')::date AS d
    FROM public.task_responses
    WHERE user_id = _user_id
  ),
  ranked AS (
    SELECT d, ROW_NUMBER() OVER (ORDER BY d DESC) AS rn
    FROM activity_days
    WHERE d <= (now() AT TIME ZONE 'UTC')::date
  )
  SELECT COALESCE(COUNT(*), 0) INTO streak
  FROM ranked
  WHERE d = ((now() AT TIME ZONE 'UTC')::date - ((rn - 1) || ' days')::interval)::date;

  confidence := LEAST(100, q_count * 5 + t_count * 8 + s_count * 10 + streak * 2);

  UPDATE public.profiles
  SET questions_asked = q_count,
      tasks_completed = t_count,
      sessions_joined = s_count,
      day_streak = streak,
      confidence_score = confidence,
      updated_at = now()
  WHERE user_id = _user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_question_change_recompute()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_profile_counters(OLD.user_id);
    RETURN OLD;
  ELSE
    PERFORM public.recompute_profile_counters(NEW.user_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_task_response_change_recompute()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_profile_counters(OLD.user_id);
    RETURN OLD;
  ELSE
    PERFORM public.recompute_profile_counters(NEW.user_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS questions_recompute_profile ON public.questions;
CREATE TRIGGER questions_recompute_profile
AFTER INSERT OR UPDATE OR DELETE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.on_question_change_recompute();

DROP TRIGGER IF EXISTS task_responses_recompute_profile ON public.task_responses;
CREATE TRIGGER task_responses_recompute_profile
AFTER INSERT OR UPDATE OR DELETE ON public.task_responses
FOR EACH ROW EXECUTE FUNCTION public.on_task_response_change_recompute();

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT user_id FROM public.profiles LOOP
    PERFORM public.recompute_profile_counters(rec.user_id);
  END LOOP;
END $$;