import { ObjectId } from "mongodb";
import { webhookLogs } from "./collections";
import type { BookingDoc, EventTypeDoc } from "./types";

interface WebhookPayload {
  event: string;
  eventType: {
    slug: string;
    title: string;
    durationMinutes: number;
  };
  booking: {
    id: string;
    guestName: string;
    guestEmail: string;
    guestTimezone: string;
    customAnswers: Record<string, string | string[]>;
    startUtc: string;
    endUtc: string;
    meetLink: string | null;
    status: string;
    manageToken: string;
    createdAt: string;
  };
}

function buildPayload(
  eventType: EventTypeDoc,
  booking: BookingDoc,
  webhookEvent: string,
): WebhookPayload {
  return {
    event: webhookEvent,
    eventType: {
      slug: eventType.slug,
      title: eventType.title,
      durationMinutes: eventType.durationMinutes,
    },
    booking: {
      id: booking._id.toString(),
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestTimezone: booking.guestTimezone,
      customAnswers: booking.customAnswers,
      startUtc: booking.startUtc.toISOString(),
      endUtc: booking.endUtc.toISOString(),
      meetLink: booking.meetLink,
      status: booking.status,
      manageToken: booking.manageToken,
      createdAt: booking.createdAt.toISOString(),
    },
  };
}

export async function dispatchWebhook(
  eventType: EventTypeDoc,
  booking: BookingDoc,
  webhookEvent: "created" | "cancelled" | "rescheduled",
): Promise<void> {
  if (!eventType.webhook?.url) return;
  if (!eventType.webhook.events.includes(webhookEvent)) return;

  const url = eventType.webhook.url;
  const payload = buildPayload(eventType, booking, webhookEvent);

  let statusCode: number | null = null;
  let success = false;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    statusCode = res.status;
    success = res.ok;
  } catch {
    // fire-and-forget: log failure but don't throw
    statusCode = null;
    success = false;
  }

  // Log delivery attempt
  try {
    await (await webhookLogs()).insertOne({
      _id: new ObjectId(),
      eventTypeSlug: eventType.slug,
      bookingId: booking._id,
      event: webhookEvent,
      url,
      payload: payload as unknown as Record<string, unknown>,
      statusCode,
      success,
      createdAt: new Date(),
    });
  } catch {
    // logging failure should never break the booking flow
  }
}
