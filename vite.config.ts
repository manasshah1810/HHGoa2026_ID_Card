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

  // Only add nitro/cloudflare plugin during actual production builds
  if (command === "build") {
    const { nitro } = await import("nitro/vite");
    plugins.push(
      nitro({
        preset: "cloudflare-pages",
        output: {
          dir: "dist",
          serverDir: "dist/server",
          publicDir: "dist/client",
        },
      })
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
