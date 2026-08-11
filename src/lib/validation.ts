import { z } from "zod";

/** Hard caps chosen so the artwork slots never overflow, even at min font size. */
export const LIMITS = {
  name: 28,
  handle: 15,
  title: 30,
  team: 24,
} as const;

export type FieldKey = keyof typeof LIMITS;

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name needs at least 2 characters")
  .max(LIMITS.name, `Keep it under ${LIMITS.name} characters`)
  .regex(/^[\p{L}\p{N}][\p{L}\p{N} .'’-]*$/u, "Letters, numbers, spaces, . ' - only");

export const handleSchema = z
  .string()
  .trim()
  .max(LIMITS.handle, `X handles max out at ${LIMITS.handle} characters`)
  .regex(/^[A-Za-z0-9_]*$/, "Handles use letters, numbers and underscores");

export const titleSchema = z
  .string()
  .trim()
  .max(LIMITS.title, `Keep it under ${LIMITS.title} characters`)
  .regex(/^[\p{L}\p{N} /&.,'’+-]*$/u, "Avoid special characters");

export const teamSchema = z
  .string()
  .trim()
  .max(LIMITS.team, `Keep it under ${LIMITS.team} characters`)
  .regex(/^[\p{L}\p{N} .'’&-]*$/u, "Letters, numbers, spaces, & . - only");

/** Strip characters as the user types so bad input never reaches the canvas. */
export const sanitize = {
  name: (v: string) => v.replace(/[^\p{L}\p{N} .'’-]/gu, "").replace(/\s{2,}/g, " ").slice(0, LIMITS.name),
  handle: (v: string) => v.replace(/^@+/, "").replace(/[^A-Za-z0-9_]/g, "").slice(0, LIMITS.handle),
  title: (v: string) => v.replace(/[^\p{L}\p{N} /&.,'’+-]/gu, "").replace(/\s{2,}/g, " ").slice(0, LIMITS.title),
  team: (v: string) => v.replace(/[^\p{L}\p{N} .'’&-]/gu, "").replace(/\s{2,}/g, " ").slice(0, LIMITS.team),
} satisfies Record<FieldKey, (v: string) => string>;

const schemas = { name: nameSchema, handle: handleSchema, title: titleSchema, team: teamSchema };

/** Returns an error message, or null when valid. Empty optional fields pass. */
export function validateField(key: FieldKey, value: string, required = false): string | null {
  if (!value.trim()) return required ? "This field is required" : null;
  const res = schemas[key].safeParse(value);
  return res.success ? null : (res.error.issues[0]?.message ?? "Invalid value");
}
