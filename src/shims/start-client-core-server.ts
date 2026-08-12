// Server-side shim for @tanstack/start-client-core
// On Vercel's Nitro server bundle, createMiddleware from @tanstack/start-client-core
// is undefined. This shim replaces the problematic functions with safe no-ops.

// Re-export everything from the real module
export * from "@tanstack/start-client-core";

// Override createCsrfMiddleware with a no-op that returns a passthrough middleware object
export const createCsrfMiddleware = (_opts?: unknown) => ({
  options: { type: "request" as const },
  "~types": undefined,
});
