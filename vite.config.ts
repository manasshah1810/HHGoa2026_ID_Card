import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(async ({ command }) => {
  const plugins = [
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
  ];

  // Add nitro plugin during production builds (detects Vercel vs Cloudflare automatically)
  if (command === "build") {
    const { nitro } = await import("nitro/vite");
    const isVercel = Boolean(process.env.VERCEL);
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
