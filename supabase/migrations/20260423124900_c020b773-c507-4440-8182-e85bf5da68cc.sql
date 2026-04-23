CREATE POLICY "Creators or admins delete sessions"
  ON public.sessions FOR DELETE
  USING (auth.uid() = creator_id OR public.has_role(auth.uid(), 'admin'));