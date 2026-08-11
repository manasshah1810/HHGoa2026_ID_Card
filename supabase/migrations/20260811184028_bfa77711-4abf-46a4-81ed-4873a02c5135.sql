CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS creator_token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(24), 'hex');

-- Keep client-visible columns explicit: creator_token and invite_code stay server-only
REVOKE SELECT ON public.teams FROM anon, authenticated;
GRANT SELECT (id, name, slug, created_at) ON public.teams TO anon, authenticated;
GRANT ALL ON public.teams TO service_role;

COMMENT ON COLUMN public.teams.creator_token IS 'Private credential issued once to the team creator. Required to rotate invite_code. Never exposed to anon/authenticated via column grants.';