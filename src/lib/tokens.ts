import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

// Letters and digits without look-alikes (no 0/O, 1/I/L), so students can read tickets aloud or retype them.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomChunk(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/** Random, non-guessable ticket ID such as CH-7K3M-9PQ2. */
export function generateTicketId(): string {
  return `CH-${randomChunk(4)}-${randomChunk(4)}`;
}

/** Secret tracking token: 32 random bytes as a URL-safe string (43 characters). Shown to the student once. */
export function generateTrackingToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only this hash is stored in the database; the raw token is never saved. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Used by tracking (Stage E): compares a submitted token with the stored hash in constant time. */
export function tokenMatchesHash(token: string, storedHash: string): boolean {
  const a = Buffer.from(hashToken(token), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
