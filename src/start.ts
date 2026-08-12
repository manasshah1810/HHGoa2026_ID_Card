import { createStart } from "@tanstack/react-start";

// Explicitly provide an empty requestMiddleware array so TanStack Start
// does NOT fall back to defaultCsrfMiddleware (which calls createMiddleware
// from @tanstack/start-client-core and crashes on Vercel's server bundle).
export const startInstance = createStart(() => ({
  requestMiddleware: [],
}));
