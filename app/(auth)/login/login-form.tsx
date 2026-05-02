"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Use native button to ensure form submit works properly
const SubmitButton = ({ pending, disabled }: { pending: boolean; disabled: boolean }) => (
  <button
    type="submit"
    className={`group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-colors duration-150 outline-none select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-8 px-2.5 w-full gap-2 ${
      pending
        ? ""
        : "bg-primary text-primary-foreground hover:bg-primary-hover"
    }`}
    disabled={disabled}
  >
    {pending ? (
      <>
        <Loader2 className="animate-spin" />
        <span>Signing in...</span>
      </>
    ) : (
      <>
        <span>Sign in</span>
        <ArrowRight />
      </>
    )}
  </button>
);

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    console.log("[login] handleSubmit called");
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    setPending(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: next,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push(next);
      }
    } catch (err) {
      console.error("[login] error:", err);
      setError("Invalid email or password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} action="#" className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
          {error}
        </p>
      )}
      <SubmitButton pending={pending} disabled={pending} />
    </form>
  );
}
