import { createServerFn } from "@tanstack/react-start";

type ProfileInput = {
  name: string;
  xHandle?: string;
  github?: string;
  linkedin?: string;
  builderTitle?: string;
  inviteCode?: string;
};

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export const createProfile = createServerFn({ method: "POST" })
  .validator((input: ProfileInput) => {
    const name = clean(input?.name, 60);
    if (name.length < 1) throw new Error("Name is required.");
    return {
      name,
      xHandle: clean(input?.xHandle, 40).replace(/^@/, ""),
      github: clean(input?.github, 60),
      linkedin: clean(input?.linkedin, 120),
      builderTitle: clean(input?.builderTitle, 80),
      inviteCode: clean(input?.inviteCode, 120),
    };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { normalizeCode, isValidCode, slugify } = await import("./teams.server");

    let teamId: string | null = null;
    if (data.inviteCode) {
      const code = normalizeCode(data.inviteCode);
      if (!isValidCode(code)) throw new Error("Invalid invite code.");
      const { data: team } = await supabaseAdmin
        .from("teams")
        .select("id")
        .eq("invite_code", code)
        .maybeSingle();
      if (!team) throw new Error("No team found with that invite code.");
      teamId = team.id;
    }

    const slug = `${slugify(data.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabaseAdmin.from("profiles").insert({
      slug,
      name: data.name,
      x_handle: data.xHandle || null,
      github: data.github || null,
      linkedin: data.linkedin || null,
      portfolio: null,
      stack: null,
      builder_title: data.builderTitle || null,
      team_id: teamId,
    });
    if (error) {
      // DB trigger raises 'team_full: ...' when a team already has 3 members
      if (error.message?.includes("team_full")) {
        throw new Error("This team already has 3 members — it's full! Ask your team to create a new one.");
      }
      throw new Error("Could not save your builder profile. Try again.");
    }
    return { slug };
  });
