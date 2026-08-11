CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.teams TO anon, authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_public_read" ON public.teams FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "teams_public_insert" ON public.teams FOR INSERT TO anon, authenticated WITH CHECK (char_length(name) BETWEEN 1 AND 60);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  x_handle text,
  github text,
  linkedin text,
  portfolio text,
  stack text,
  builder_title text,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "profiles_public_insert" ON public.profiles FOR INSERT TO anon, authenticated WITH CHECK (char_length(name) BETWEEN 1 AND 60);
CREATE INDEX profiles_team_id_idx ON public.profiles(team_id);