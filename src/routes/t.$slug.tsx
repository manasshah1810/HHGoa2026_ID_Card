import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/t/$slug")({
  loader: async ({ params }) => {
    const { data: team } = await supabase
      .from("teams")
      .select("id, name")
      .eq("slug", params.slug)
      .maybeSingle();
    if (!team) throw notFound();
    const { data: members } = await supabase
      .from("profiles")
      .select("slug, name, builder_title, x_handle, github, linkedin")
      .eq("team_id", team.id)
      .order("created_at", { ascending: true });
    return { team, members: members ?? [] };
  },
  head: ({ params, loaderData }) => {
    const name = loaderData?.team.name ?? "Team";
    const title = `${name} — HH Goa 2026 Team`;
    const description = `${name} is building at Hacker House Goa 2026. Scan the team QR on any card to see every builder ID in the crew.`;
    const url = `https://hhgoa-identity-forge.app/t/${params.slug}`;
    const members = loaderData?.members ?? [];
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            url,
            description,
            about: { "@type": "Organization", name },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: members.length,
              itemListElement: members.map(
                (m: { slug: string; name: string; builder_title: string | null }, i: number) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  item: {
                    "@type": "Person",
                    name: m.name,
                    ...(m.builder_title ? { jobTitle: m.builder_title } : {}),
                    url: `https://hhgoa-identity-forge.app/b/${m.slug}`,
                  },
                }),
              ),
            },
          }),
        },
      ],
    };
  },

  component: TeamPage,
});

function TeamPage() {
  const { team, members } = Route.useLoaderData();
  return (
    <main className="min-h-screen bg-background px-6 py-20 text-foreground">
      <div className="mx-auto max-w-xl">
        <Link to="/" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          HH GOA <span className="text-primary">2026</span>
        </Link>
        <h1 className="font-display mt-6 text-5xl font-bold tracking-tight">{team.name}</h1>
        <p className="mt-2 text-muted-foreground">{members.length} builder(s)</p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {members.map((m: {
            slug: string;
            name: string;
            builder_title: string | null;
            x_handle: string | null;
            github: string | null;
            linkedin: string | null;
          }) => (
            <li key={m.slug}>
              <Link
                to="/b/$slug"
                params={{ slug: m.slug }}
                search={{ team: "" }}
                className="block rounded-3xl border border-border bg-card p-5 transition hover:border-primary"
              >
                <p className="text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
                  HH Goa 2026 &middot; Builder ID
                </p>
                <p className="font-display mt-3 text-2xl font-bold leading-tight">{m.name}</p>
                <p className="mt-1 text-sm text-primary">{m.builder_title ?? "Builder"}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {[m.x_handle ? `@${m.x_handle}` : null, m.github, m.linkedin ? "LinkedIn" : null]
                    .filter(Boolean)
                    .join(" \u00b7 ") || "View card"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
