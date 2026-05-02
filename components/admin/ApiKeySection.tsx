"use client";

import { useState, useTransition } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateNewApiKey, revokeApiKey } from "@/server-actions/api-key";

export function ApiKeySection({ hasKey }: { hasKey: boolean }) {
  const [pending, start] = useTransition();
  const [revealed, setRevealed] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  return (
    <div className="space-y-5 max-w-xl">
      <p className="text-[13px] leading-relaxed text-ink-soft">
        Use an API key to create bookings programmatically from tools like n8n.
        Include it as <code className="rounded bg-surface-hover px-1 py-0.5 font-mono text-[12px]">Authorization: Bearer {"<key>"}</code> in your requests.
      </p>

      {newKey && (
        <div className="rounded-lg border border-success/40 bg-success/5 p-4 space-y-3">
          <p className="text-[13px] font-medium text-success">
            API key generated — copy it now, it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={newKey}
              type={revealed ? "text" : "password"}
              className="font-mono text-[13px]"
              onCopy={() => setRevealed(true)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setRevealed((r) => !r)}
              aria-label={revealed ? "Hide key" : "Reveal key"}
            >
              {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {hasKey && !newKey && (
          <div className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[13px] text-ink-soft">
            An API key is configured. It is not stored in plain text and cannot be displayed.
          </div>
        )}
        <div className="flex items-center gap-3">
          <form action={() => start(() => {
            (async () => {
              const { key } = await generateNewApiKey();
              setNewKey(key);
              setRevealed(true);
            })();
          })}>
            <Button type="submit" disabled={pending} className="gap-2">
              {pending ? (
                <>
                  <Loader2 className="animate-spin" />
                  <span>Generating…</span>
                </>
              ) : (
                <span>{hasKey ? "Regenerate key" : "Generate key"}</span>
              )}
            </Button>
          </form>
          {hasKey && !newKey && (
            <form action={() => start(() => {
              (async () => {
                await revokeApiKey();
              })();
            })}>
              <Button type="submit" variant="outline" size="sm" disabled={pending}>
                Revoke
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-bg-elevated p-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted mb-2">
          Example request
        </p>
        <pre className="font-mono text-[11px] text-ink-soft whitespace-pre-wrap leading-relaxed">
{`curl -X POST https://your-domain.com/api/v1/bookings \
  -H "Authorization: Bearer kal_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "slug": "your-event-slug",
    "startUtc": "2026-05-15T14:00:00.000Z",
    "guestName": "Jane Doe",
    "guestEmail": "jane@example.com"
  }'`}
        </pre>
      </div>
    </div>
  );
}
