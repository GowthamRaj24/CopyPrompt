"use client";

import {
  AlertCircleIcon,
  CheckCircleIcon,
  Loader2Icon,
  MailIcon,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELD_CLASS =
  "h-11 rounded-md border-border bg-background text-[14px] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFormError("Email is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setFormError(errBody.error ?? "Could not send reset link.");
        setSubmitting(false);
        return;
      }

      setSubmittedEmail(trimmedEmail);
    } catch {
      setFormError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (submittedEmail) {
    return (
      <div className="flex flex-col items-center gap-5 py-2 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-primary/15 text-primary">
          <CheckCircleIcon className="size-7" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-[-0.02em]">
            Reset link sent
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            If <strong className="font-semibold text-foreground">{submittedEmail}</strong>{" "}
            has an account, we&apos;ve sent a password reset link.
          </p>
        </div>
        <p className="text-[12px] text-muted-foreground">
          Don&apos;t see it? Check your spam folder.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <Label htmlFor="email" className="mb-1.5 block text-[13px] font-medium">
          Email
        </Label>
        <div className="relative">
          <MailIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`${FIELD_CLASS} pl-10`}
          />
        </div>
      </div>

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[13px] text-destructive"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="magnetic h-11 w-full rounded-md bg-primary text-[14px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-[0_8px_24px_-8px_oklch(0.66_0.21_270_/_0.45)]"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            Sending link…
          </>
        ) : (
          "Send reset link"
        )}
      </Button>
    </form>
  );
}
