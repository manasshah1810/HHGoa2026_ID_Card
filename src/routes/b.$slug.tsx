import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/b/$slug")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = typeof search['team'] === "string" ? search['team'] : "";
    const team = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    return { team: team || undefined };
  },
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("profiles")
      .select("name, x_handle, github, linkedin, portfolio, stack, builder_title, team_id")
      .eq("slug", params.slug)
      .maybeSingle();
    if (!data) throw notFound();
    let team: { name: string; slug: string } | null = null;
    if (data.team_id) {
      const { data: t } = await supabase
        .from("teams")
        .select("name, slug")
        .eq("id", data.team_id)
        .maybeSingle();
      team = t ?? null;
    }
    return { profile: data, team };
  },
  head: ({ params, loaderData }) => {
    const name = loaderData?.profile.name ?? "Builder";
    const title = `${name} — HH Goa 2026 Builder`;
    const role = loaderData?.profile.builder_title;
    const teamName = loaderData?.team?.name;
    const description = [
      `${name} is building at Hacker House Goa 2026${role ? ` as ${role}` : ""}${teamName ? ` with team ${teamName}` : ""}.`,
      "View their custom builder ID cards and themed PFPs from Hacker House Goa 2026, and create your own.",
    ]
      .join(" ")
      .slice(0, 158);
    const url = `https://hhgoa-identity-forge.app/b/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name,
            url,
            ...(role ? { jobTitle: role } : {}),
            ...(teamName ? { memberOf: { "@type": "Organization", name: teamName } } : {}),
            ...(loaderData?.profile.stack ? { knowsAbout: loaderData.profile.stack } : {}),
            sameAs: [
              loaderData?.profile.x_handle
                ? `https://x.com/${loaderData.profile.x_handle.replace(/^@/, "")}`
                : null,
              loaderData?.profile.github ?? null,
              loaderData?.profile.linkedin ?? null,
              loaderData?.profile.portfolio ?? null,
            ].filter(Boolean),
          }),
        },
      ],
    };

  },

  component: ProfilePage,
});

function ProfilePage() {
  const { profile, team } = Route.useLoaderData();
  const { team: inviteFromQr } = Route.useSearch();
  const links = [
    profile.x_handle && { label: "X / Twitter", href: `https://x.com/${profile.x_handle.replace(/^@/, "")}` },
    profile.github && { label: "GitHub", href: toUrl(profile.github) },
    profile.linkedin && { label: "LinkedIn", href: toUrl(profile.linkedin) },
    profile.portfolio && { label: "Portfolio", href: toUrl(profile.portfolio) },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <main className="min-h-screen bg-background px-6 py-20 text-foreground">
      <div className="mx-auto max-w-xl">
        <Link to="/" className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">
          ← HH GOA <span className="text-primary">2026</span>
        </Link>
        <h1 className="font-display mt-6 text-5xl font-bold tracking-tight">{profile.name}</h1>
        {profile.builder_title && (
          <p className="font-display mt-2 text-xl font-semibold text-primary">
            {profile.builder_title}
          </p>
        )}
        {profile.stack && <p className="mt-2 text-muted-foreground">{profile.stack}</p>}

        {inviteFromQr && (
          <div className="mt-6 rounded-lg border-2 border-primary/40 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground">
              You scanned {profile.name}&apos;s card{team ? ` — join team ${team.name}` : ""}.
            </p>
            <Link
              to="/"
              search={{ team: inviteFromQr }}
              className="font-display mt-3 inline-block rounded-sm bg-primary px-5 py-2 text-sm font-bold uppercase tracking-wide text-primary-foreground"
            >
              Make my HH Goa card
            </Link>
          </div>
        )}

        {team && (
          <div className="mt-8 rounded-xl border border-border bg-secondary/20 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">Team</p>
            <Link
              to="/t/$slug"
              params={{ slug: team.slug }}
              className="group flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-5 py-4 hover:bg-primary/20 transition-colors"
            >
              <div>
                <p className="font-display text-xl font-bold tracking-tight">{team.name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">View all team ID cards →</p>
              </div>
              <span className="text-2xl">👥</span>
            </Link>
          </div>
        )}

        {links.length > 0 && (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">Links</p>
            <div className="flex flex-wrap gap-3">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-secondary px-5 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function toUrl(v: string) {
  return /^https?:\/\//.test(v) ? v : `https://${v}`;
}
