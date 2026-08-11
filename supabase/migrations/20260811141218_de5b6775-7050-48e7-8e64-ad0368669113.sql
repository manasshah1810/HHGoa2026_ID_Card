ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS invite_code text;

UPDATE public.teams
SET invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE invite_code IS NULL;

ALTER TABLE public.teams ALTER COLUMN invite_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS teams_invite_code_key ON public.teams (invite_code);