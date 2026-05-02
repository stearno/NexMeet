"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { cancelBookingAsAdmin } from "@/server-actions/bookings";

export function CancelBookingButton({ manageToken }: { manageToken: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Cancel this booking? The guest will be notified via Google Calendar.")) return;
        start(() => { void cancelBookingAsAdmin(manageToken); });
      }}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-danger opacity-0 transition-opacity duration-150 hover:bg-danger/10 group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-40"
      title="Cancel booking"
    >
      <X size={11} />
      {pending ? "Cancelling…" : "Cancel"}
    </button>
  );
}
