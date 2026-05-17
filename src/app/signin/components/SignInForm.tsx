"use client";

import { AlertCircleIcon, Loader2Icon, MailIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/ui/google-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

interface SignInFormProps {
  next?: string;
}

const FIELD_CLASS =
  "h-11 rounded-md border-border bg-background text-[14px] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

export function SignInForm({ next }: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setFormError("Enter your email and password to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        if (res.status === 403) {
          setFormError(
            errBody.error ??
              "Please verify your email before signing in. Check your inbox.",
          );
        } else if (res.status === 401) {
          setFormError("Email or password is incorrect.");
        } else {
          setFormError(errBody.error ?? "Could not sign you in. Try again.");
        }
        setSubmitting(false);
        return;
      }

      toast.success("Welcome back");
      router.push(next ?? "/");
      router.refresh();
    } catch {
      setFormError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <GoogleButton next={next} />

      <Divider />

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
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`${FIELD_CLASS} pl-10`}
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <Label htmlFor="password" className="text-[13px] font-medium">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Forgot?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className={FIELD_CLASS}
          />
        </div>

        {formError && <FormErrorBanner message={formError} />}

        <Button
          type="submit"
          size="lg"
          className="magnetic h-11 w-full rounded-md bg-primary text-[14px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-[0_8px_24px_-8px_oklch(0.66_0.21_270_/_0.45)]"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-[12px] text-muted-foreground">
      <div className="h-px flex-1 bg-border" />
      <span className="font-medium">or with email</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function FormErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[13px] text-destructive"
    >
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
