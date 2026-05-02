"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eventTypes } from "@/lib/collections";
import { eventTypeFormSchema } from "@/lib/validation";
import { requireAdmin } from "@/lib/auth-helpers";
import type { EventTypeDoc } from "@/lib/types";

export async function createEventType(formData: FormData) {
  await requireAdmin();
  const parsed = eventTypeFormSchema.parse(JSON.parse(String(formData.get("payload"))));
  const col = await eventTypes();
  const last = await col.find().sort({ position: -1 }).limit(1).toArray();
  const position = (last[0]?.position ?? 0) + 1;
  const doc: EventTypeDoc = {
    _id: new ObjectId(),
    ...parsed,
    position,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await col.insertOne(doc);
  revalidatePath("/event-types");
  redirect("/event-types");
}

export async function updateEventType(id: string, formData: FormData) {
  await requireAdmin();
  const parsed = eventTypeFormSchema.parse(JSON.parse(String(formData.get("payload"))));
  const col = await eventTypes();
  await col.updateOne({ _id: new ObjectId(id) }, { $set: { ...parsed, updatedAt: new Date() } });
  revalidatePath("/event-types");
  redirect("/event-types");
}

export async function deleteEventType(id: string) {
  await requireAdmin();
  await (await eventTypes()).deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/event-types");
}

export async function toggleActive(id: string, active: boolean) {
  await requireAdmin();
  await (await eventTypes()).updateOne(
    { _id: new ObjectId(id) },
    { $set: { active, updatedAt: new Date() } },
  );
  revalidatePath("/event-types");
}

export async function duplicateEventType(id: string) {
  await requireAdmin();
  const col = await eventTypes();
  const original = await col.findOne({ _id: new ObjectId(id) });
  if (!original) return;

  // find a unique slug: try "slug-copy", "slug-copy-2", etc.
  let candidateSlug = `${original.slug}-copy`;
  let suffix = 2;
  while (await col.findOne({ slug: candidateSlug })) {
    candidateSlug = `${original.slug}-copy-${suffix++}`;
  }

  const last = await col.find().sort({ position: -1 }).limit(1).toArray();
  const position = (last[0]?.position ?? 0) + 1;

  const { _id, createdAt, updatedAt, slug, title, ...rest } = original;
  await col.insertOne({
    ...rest,
    _id: new ObjectId(),
    slug: candidateSlug,
    title: `${title} (Copy)`,
    active: false,
    position,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  revalidatePath("/event-types");
}

export async function reorderEventType(id: string, newPosition: number) {
  await requireAdmin();
  await (await eventTypes()).updateOne(
    { _id: new ObjectId(id) },
    { $set: { position: newPosition, updatedAt: new Date() } },
  );
  revalidatePath("/event-types");
}

export async function testWebhook(url: string): Promise<{ ok: boolean; status: number | null; error?: string }> {
  await requireAdmin();

  const now = new Date();
  const end = new Date(now.getTime() + 30 * 60_000);
  const payload = {
    event: "created",
    eventType: { slug: "test-event", title: "Test Event", durationMinutes: 30 },
    booking: {
      id: "000000000000000000000000",
      guestName: "Jane Smith",
      guestEmail: "jane@example.com",
      guestTimezone: "America/New_York",
      customAnswers: { "sample-question": "Sample answer" },
      startUtc: now.toISOString(),
      endUtc: end.toISOString(),
      meetLink: "https://meet.google.com/test-link",
      status: "confirmed",
      manageToken: "test-manage-token",
      createdAt: now.toISOString(),
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, status: null, error: err instanceof Error ? err.message : "Request failed" };
  }
}
