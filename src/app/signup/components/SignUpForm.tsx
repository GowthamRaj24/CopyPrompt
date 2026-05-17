"use client";

import {
  AlertCircleIcon,
  CheckCircleIcon,
  Loader2Icon,
  MailIcon,
  UserIcon,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { isTurnstileEnabled, Turnstile } from "@/components/captcha/Turnstile";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/ui/google-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

interface SignUpFormProps {
  next?: string;
}

const PASSWORD_MIN = 10;
const FIELD_CLASS =
  "h-11 rounded-md border-border bg-background text-[14px] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

export function SignUpForm({ next }: SignUpFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRequired = isTurnstileEnabled();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setFormError("Email and password are required.");
      return;
    }
    if (password.length < PASSWORD_MIN) {
      setFormError(`Password must be at least ${PASSWORD_MIN} characters.`);
      return;
    }
    if (captchaRequired && !captchaToken) {
      setFormError("Please complete the captcha challenge.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
          name: name.trim() || undefined,
          captchaToken,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setFormError(errBody.error ?? "Could not create your account.");
        setSubmitting(false);
        return;
      }

      setSubmittedEmail(trimmedEmail);
      toast.success("Account created. Check your inbox.");
    } catch {
      setFormError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (submittedEmail) {
    return <EmailSentScreen email={submittedEmail} />;
  }

  return (
    <>
      <GoogleButton label="Sign up with Google" next={next} />

      <Divider />

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <Label htmlFor="name" className="mb-1.5 block text-[13px] font-medium">
            Name <span className="text-muted-foreground">(optional)</span>
          </Label>
          <div className="relative">
            <UserIcon
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={`${FIELD_CLASS} pl-10`}
            />
          </div>
        </div>

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
          <Label htmlFor="password" className="mb-1.5 block text-[13px] font-medium">
            Password
          </Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`At least ${PASSWORD_MIN} characters`}
            hint={`${PASSWORD_MIN}+ characters with letters, numbers and symbols.`}
            className={FIELD_CLASS}
          />
        </div>

        {captchaRequired && (
          <Turnstile onVerify={setCaptchaToken} action="signup" />
        )}

        {formError && <FormErrorBanner message={formError} />}

        <Button
          type="submit"
          size="lg"
          className="magnetic h-11 w-full rounded-md bg-primary text-[14px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-[0_8px_24px_-8px_oklch(0.66_0.21_270_/_0.45)]"
          disabled={submitting || (captchaRequired && !captchaToken)}
        >
          {submitting ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>

        <p className="text-center text-[12px] text-muted-foreground">
          By creating an account you agree to our terms and privacy notice.
        </p>
      </form>
    </>
  );
}

function EmailSentScreen({ email }: { email: string }) {
  const [resending, setResending] = useState(false);

  async function handleResend() {
    if (resending) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) toast.success("Verification email sent again");
      else toast.error("Could not resend. Try again shortly.");
    } catch {
      toast.error("Network error");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 py-2 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-primary/15 text-primary">
        <CheckCircleIcon className="size-7" aria-hidden strokeWidth={2} />
      </span>
      <div>
        <h2 className="text-xl font-bold tracking-[-0.02em]">
          Check your inbox
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          We sent a verification link to{" "}
          <strong className="font-semibold text-foreground">{email}</strong>.
          Click it to activate your account.
        </p>
      </div>
      <p className="text-[12px] text-muted-foreground">
        Don&apos;t see it? Check your spam folder.
      </p>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="press h-11 w-full rounded-md text-[14px]"
        disabled={resending}
        onClick={handleResend}
      >
        {resending ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            Resending…
          </>
        ) : (
          "Resend verification email"
        )}
      </Button>
    </div>
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
