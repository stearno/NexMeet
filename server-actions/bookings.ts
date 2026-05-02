"use server";

import { revalidatePath } from "next/cache";
import { cancelBooking } from "@/lib/booking";
import { requireAdmin } from "@/lib/auth-helpers";

export async function cancelBookingAsAdmin(manageToken: string) {
  await requireAdmin();
  await cancelBooking(manageToken);
  revalidatePath("/bookings");
}
