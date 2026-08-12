import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Vite plugin that replaces the body of createCsrfMiddleware in the
// @tanstack/start-server-core SSR bundle so it doesn't call createMiddleware
// (which is undefined in Vercel's server runtime).
function patchCsrfMiddleware() {
  return {
    name: "patch-csrf-middleware",
    enforce: "pre" as const,
    transform(code: string, id: string) {
      if (
        id.includes("start-server-core") &&
        id.includes("createStartHandler") &&
        code.includes("defaultCsrfMiddleware")
      ) {
        // Replace the top-level createCsrfMiddleware call with a safe passthrough no-op.
        // This prevents "createMiddleware is not a function" crashes on Vercel.
        return code.replace(
          /var defaultCsrfMiddleware\s*=\s*createCsrfMiddleware\([^)]*\);/,
          `var defaultCsrfMiddleware = { options: { type: "request", server: undefined }, "~types": undefined };`
        );
      }
    },
  };
}

export default defineConfig(async ({ command }) => {
  const plugins = [
    tailwindcss(),
    patchCsrfMiddleware(),
    tanstackStart({
      server: { entry: "server" },
      serverFns: {
        disableCsrfMiddlewareWarning: true,
      },
    }),
    viteReact(),
  ];

  // Add nitro plugin during production builds (detects Vercel vs Cloudflare automatically)
  if (command === "build") {
    const { nitro } = await import("nitro/vite");
    const isVercel = Boolean(process.env["VERCEL"]);
    plugins.push(
      nitro(
        isVercel
          ? { preset: "vercel" }
          : {
              preset: "cloudflare-pages",
              output: {
                dir: "dist",
                serverDir: "dist/server",
                publicDir: "dist/client",
              },
            }
      )
    );
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      host: "::",
      port: 8080,
    },
  };
});
