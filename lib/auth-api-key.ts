import { users } from "./collections";
import { verifyApiKey } from "./api-key";

/**
 * Validates an API key from the Authorization header.
 * Expects: "Authorization: Bearer <api-key>"
 *
 * @returns userId string if valid, null otherwise
 */
export async function authenticateApiKey(authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  const plaintext = parts[1] as string | undefined;
  if (!plaintext || !plaintext.startsWith("kal_")) return null;

  // Find any user with a matching API key hash
  // In a single-user system this is efficient; for multi-user we'd need an index
  const col = await users();
  const user = await col.findOne({ apiKeyHash: { $ne: null } });
  if (!user) return null;
  if (!user.apiKeyHash) return null;

  if (verifyApiKey(plaintext, user.apiKeyHash)) {
    return user._id.toString();
  }

  return null;
}
