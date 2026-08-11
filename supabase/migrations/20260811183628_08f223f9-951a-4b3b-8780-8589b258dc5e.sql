-- 1) Teams: hide invite_code from public reads via column-level grants
REVOKE SELECT ON public.teams FROM anon, authenticated;
GRANT SELECT (id, name, slug, created_at) ON public.teams TO anon, authenticated;
GRANT ALL ON public.teams TO service_role;

-- 2) Profiles: no direct client inserts; creation happens server-side only
DROP POLICY IF EXISTS profiles_public_insert ON public.profiles;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 3) Invite attempts: intentionally private, server-side only
REVOKE ALL ON public.invite_attempts FROM anon, authenticated;
GRANT ALL ON public.invite_attempts TO service_role;
COMMENT ON TABLE public.invite_attempts IS 'Internal rate-limit log. No client access by design: RLS enabled with no policies and no grants to anon/authenticated. Written only by trusted server-side code using the service role.';