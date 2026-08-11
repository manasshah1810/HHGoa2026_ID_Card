const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const makeInviteCode = () => {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
};

export const normalizeCode = (raw: string) =>
  raw
    .trim()
    .toUpperCase()
    .replace(/.*[/?&]TEAM=/i, "")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);

export const isValidCode = (code: string) => /^[A-HJ-NP-Z2-9]{8,10}$/.test(code);

export const hashIp = async (ip: string) => {
  const data = new TextEncoder().encode(`hh-goa-invite:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "team";
