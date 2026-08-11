import { createServerFn } from "@tanstack/react-start";
import { getRequestIP, getRequestHeader } from "@tanstack/react-start/server";

type Attempt = { kind: "join" | "regenerate" | "create"; ok: boolean };

const WINDOW_MINUTES = 10;
const MAX_FAILED = 8;
const MAX_TOTAL = 30;

async function clientKey() {
  const { hashIp } = await import("./teams.server");
  const ip =
    getRequestIP({ xForwardedFor: true }) ??
    getRequestHeader("cf-connecting-ip") ??
    getRequestHeader("x-real-ip") ??
    "unknown";
  return hashIp(ip);
}

async function guard(kind: Attempt["kind"]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const ipHash = await clientKey();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { data } = await supabaseAdmin
    .from("invite_attempts")
    .select("ok")
    .eq("ip_hash", ipHash)
    .eq("kind", kind)
    .gte("created_at", since);
  const rows = data ?? [];
  const failed = rows.filter((r) => !r.ok).length;
  if (failed >= MAX_FAILED || rows.length >= MAX_TOTAL) {
    throw new Error("Too many attempts. Wait a few minutes and try again.");
  }
  return {
    supabaseAdmin,
    record: async (ok: boolean) => {
      await supabaseAdmin.from("invite_attempts").insert({ ip_hash: ipHash, kind, ok });
    },
  };
}

export const joinTeamByCode = createServerFn({ method: "POST" })
  .validator((input: { code: string }) => {
    if (typeof input?.code !== "string") throw new Error("Invite code required.");
    return { code: input.code.slice(0, 120) };
  })
  .handler(async ({ data }) => {
    const { normalizeCode, isValidCode } = await import("./teams.server");
    const code = normalizeCode(data.code);
    const { supabaseAdmin, record } = await guard("join");
    if (!isValidCode(code)) {
      await record(false);
      throw new Error("That invite code doesn't look right.");
    }
    const { data: team } = await supabaseAdmin
      .from("teams")
      .select("id,name,slug,invite_code")
      .eq("invite_code", code)
      .maybeSingle();
    await record(Boolean(team));
    if (!team) throw new Error("No team found with that invite code.");

    // Enforce 3-member cap before allowing a join
    const { count } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("team_id", team.id);
    if ((count ?? 0) >= 3) {
      throw new Error("This team already has 3 members — it's full! Ask your team to create a new one.");
    }

    return { id: team.id, name: team.name, slug: team.slug, code: team.invite_code };
  });

export const createTeam = createServerFn({ method: "POST" })
  .validator((input: { name: string }) => {
    const name = (input?.name ?? "").trim();
    if (name.length < 2 || name.length > 60) throw new Error("Team name must be 2–60 characters.");
    return { name };
  })
  .handler(async ({ data }) => {
    const { makeInviteCode, slugify } = await import("./teams.server");
    const { supabaseAdmin, record } = await guard("create");

    // Check for an existing team with the same name (case-insensitive)
    const { data: existing } = await supabaseAdmin
      .from("teams")
      .select("id")
      .ilike("name", data.name)
      .maybeSingle();
    if (existing) {
      await record(false);
      throw new Error(`A team named "${data.name}" already exists. Choose a different name.`);
    }

    const code = makeInviteCode();
    const { data: created, error } = await supabaseAdmin
      .from("teams")
      .insert({
        name: data.name,
        slug: `${slugify(data.name)}-${code.slice(0, 4).toLowerCase()}`,
        invite_code: code,
      })
      .select("id,name,slug,invite_code,creator_token")
      .single();
    await record(!error);
    if (error) {
      // Catch the DB-level unique violation as a fallback
      const isDupe = error.code === "23505" || error.message?.includes("unique");
      throw new Error(isDupe
        ? `A team named "${data.name}" already exists. Choose a different name.`
        : "Could not create that team. Try another name."
      );
    }
    return {
      id: created.id,
      name: created.name,
      slug: created.slug,
      code: created.invite_code,
      creatorToken: created.creator_token,
    };
  });

export const regenerateInviteCode = createServerFn({ method: "POST" })
  .validator((input: { teamId: string; creatorToken: string }) => ({
    teamId: String(input?.teamId ?? "").slice(0, 64),
    creatorToken: String(input?.creatorToken ?? "").slice(0, 200),
  }))
  .handler(async ({ data }) => {
    const { makeInviteCode } = await import("./teams.server");
    const { supabaseAdmin, record } = await guard("regenerate");
    if (!/^[0-9a-f-]{36}$/i.test(data.teamId) || !/^[0-9a-f]{32,96}$/i.test(data.creatorToken)) {
      await record(false);
      throw new Error("Only the person who created this team can refresh the code.");
    }
    const nextCode = makeInviteCode();
    const { data: updated, error } = await supabaseAdmin
      .from("teams")
      .update({ invite_code: nextCode })
      .eq("id", data.teamId)
      .eq("creator_token", data.creatorToken)
      .select("id,name,slug,invite_code")
      .maybeSingle();
    await record(Boolean(updated));
    if (error || !updated) {
      throw new Error("Only the person who created this team can refresh the code.");
    }
    return { id: updated.id, name: updated.name, slug: updated.slug, code: updated.invite_code };
  });
