"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { users } from "@/lib/collections";
import { requireAdmin } from "@/lib/auth-helpers";
import { generateApiKey } from "@/lib/api-key";

export async function generateNewApiKey(): Promise<{ key: string }> {
  const session = await requireAdmin();
  const { plaintext, hash } = generateApiKey();

  await (await users()).updateOne(
    { _id: new ObjectId(session.user.id) },
    { $set: { apiKeyHash: hash, updatedAt: new Date() } },
  );

  revalidatePath("/settings");
  // Return plaintext only this once — it cannot be retrieved again
  return { key: plaintext };
}

export async function revokeApiKey(): Promise<void> {
  const session = await requireAdmin();

  await (await users()).updateOne(
    { _id: new ObjectId(session.user.id) },
    { $set: { apiKeyHash: null, updatedAt: new Date() } },
  );

  revalidatePath("/settings");
}
