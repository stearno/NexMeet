import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createBooking, BookingError } from "@/lib/booking";
import { authenticateApiKey } from "@/lib/auth-api-key";

const apiBookingSchema = z.object({
  slug: z.string().min(1),
  startUtc: z.iso.datetime(),
  guestName: z.string().min(1).max(80),
  guestEmail: z.email().max(254),
  guestTimezone: z.string().min(1).default("UTC"),
  customAnswers: z.record(z.string(), z.union([z.string().max(2000), z.array(z.string())])).default({}),
});

export async function POST(req: NextRequest) {
  const userId = await authenticateApiKey(req.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "unauthorized", message: "Valid API key required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = apiBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const booking = await createBooking({
      slug: parsed.data.slug,
      startUtc: new Date(parsed.data.startUtc),
      guestName: parsed.data.guestName,
      guestEmail: parsed.data.guestEmail,
      guestTimezone: parsed.data.guestTimezone,
      customAnswers: parsed.data.customAnswers,
      alignToSlots: false,
    });

    return NextResponse.json({
      token: booking.manageToken,
      booking: {
        id: booking._id.toString(),
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        startUtc: booking.startUtc.toISOString(),
        endUtc: booking.endUtc.toISOString(),
        meetLink: booking.meetLink,
        status: booking.status,
      },
    });
  } catch (err) {
    if (err instanceof BookingError) {
      const status =
        err.code === "slot_taken" ? 409 :
        err.code === "not_found" ? 404 :
        err.code === "calendar" ? 503 : 400;
      return NextResponse.json({ error: err.code, message: err.message }, { status });
    }
    console.error("[api/v1/bookings] unexpected error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "server", message }, { status: 500 });
  }
}
