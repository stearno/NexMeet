import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

/**
 * Generates a new API key and returns { plaintext, hash }.
 * The plaintext is shown to the user once; the hash is stored in the DB.
 *
 * Format: kal_<32 hex chars>
 */
export function generateApiKey(): { plaintext: string; hash: string } {
  const raw = randomBytes(16).toString("hex");
  const plaintext = `kal_${raw}`;
  const hash = hashApiKey(plaintext);
  return { plaintext, hash };
}

/**
 * Hashes an API key using scrypt with a random salt.
 * Output format: "$"<N_hex>"$"<r>"$"<p>"$"<salt_b64>"$"<hash_b64>
 */
function hashApiKey(key: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const derived = scryptSync(key, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return [
    `$${SCRYPT_N.toString(16)}`,
    `$${SCRYPT_R}`,
    `$${SCRYPT_P}`,
    `$${salt.toString("base64url")}`,
    `$${derived.toString("base64url")}`,
  ].join("");
}

/**
 * Verifies a plaintext API key against a stored hash.
 *
 * @param plaintext the raw API key from the request header
 * @param storedHash the hash stored in the database
 * @returns true if the key matches
 */
export function verifyApiKey(plaintext: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split("$").filter(Boolean);
    if (parts.length !== 5) return false;

    const n = parseInt(parts[0] ?? "0", 16);
    const r = parseInt(parts[1] ?? "0");
    const p = parseInt(parts[2] ?? "0");
    const salt = Buffer.from(parts[3] ?? "", "base64url");
    const expected = Buffer.from(parts[4] ?? "", "base64url");

    const derived = scryptSync(plaintext, salt, expected.length, {
      N: n,
      r,
      p,
    });

    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
