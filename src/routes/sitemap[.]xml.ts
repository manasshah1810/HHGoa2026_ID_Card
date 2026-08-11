import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://hhgoa-identity-forge.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [{ path: "/", changefreq: "weekly", priority: "1.0" }];

        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (url && key) {
          const supabasePublic = createClient<Database>(url, key, {
            auth: { persistSession: false },
            global: {
              fetch: (input, init) => {
                const h = new Headers(init?.headers);
                if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
                  h.delete("Authorization");
                }
                h.set("apikey", key);
                return fetch(input, { ...init, headers: h });
              },
            },
          });

          const [{ data: profiles }, { data: teams }] = await Promise.all([
            supabasePublic.from("profiles").select("slug").limit(5000),
            supabasePublic.from("teams").select("slug").limit(5000),
          ]);

          for (const p of profiles ?? []) {
            entries.push({ path: `/b/${p.slug}`, changefreq: "monthly", priority: "0.7" });
          }
          for (const t of teams ?? []) {
            entries.push({ path: `/t/${t.slug}`, changefreq: "monthly", priority: "0.6" });
          }
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
