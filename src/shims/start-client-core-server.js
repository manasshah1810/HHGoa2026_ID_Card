// Server-side shim for @tanstack/start-client-core
// On Vercel's Nitro server bundle, createMiddleware from @tanstack/start-client-core
// is undefined at module-load time. This shim overrides createCsrfMiddleware with a
// safe no-op so the server starts without crashing.

// Re-export everything from the real module
export * from "@tanstack/start-client-core";

// Override createCsrfMiddleware with a no-op passthrough middleware
export const createCsrfMiddleware = (_opts) => ({
  options: { type: "request" },
  "~types": undefined,
});
