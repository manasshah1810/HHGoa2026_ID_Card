-- 1. Unique constraint on team name (case-insensitive)
ALTER TABLE public.teams
  ADD CONSTRAINT teams_name_unique UNIQUE (name);

-- Case-insensitive name index so "Mythos" and "MYTHOS" are treated as duplicates
CREATE UNIQUE INDEX teams_name_ci_unique ON public.teams (lower(name));

-- Drop the plain unique constraint (the CI index is stronger and covers it)
ALTER TABLE public.teams
  DROP CONSTRAINT teams_name_unique;

-- 2. Trigger: enforce max 3 members per team on INSERT into profiles
CREATE OR REPLACE FUNCTION public.check_team_member_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  member_count integer;
BEGIN
  IF NEW.team_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT COUNT(*) INTO member_count
    FROM public.profiles
   WHERE team_id = NEW.team_id;
  IF member_count >= 3 THEN
    RAISE EXCEPTION 'team_full: This team already has 3 members, which is the maximum.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_team_member_limit
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_team_member_limit();
