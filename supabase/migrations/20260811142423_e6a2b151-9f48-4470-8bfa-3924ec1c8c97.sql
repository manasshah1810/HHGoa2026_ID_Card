CREATE TABLE public.invite_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  kind text NOT NULL,
  ok boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.invite_attempts TO service_role;
ALTER TABLE public.invite_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX invite_attempts_lookup_idx ON public.invite_attempts (ip_hash, kind, created_at DESC);

REVOKE SELECT, INSERT ON public.teams FROM anon, authenticated;
GRANT SELECT (id, name, slug, created_at) ON public.teams TO anon, authenticated;
DROP POLICY IF EXISTS "teams_public_insert" ON public.teams;