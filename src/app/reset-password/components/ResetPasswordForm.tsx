"use client";

import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

interface ResetPasswordFormProps {
  tokenHash: string;
}

const PASSWORD_MIN = 10;
const FIELD_CLASS =
  "h-11 rounded-md border-border bg-background text-[14px] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

export function ResetPasswordForm({ tokenHash }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);

    if (password.length < PASSWORD_MIN) {
      setFormError(`Password must be at least ${PASSWORD_MIN} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenHash, password }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setFormError(errBody.error ?? "Could not reset password.");
        setSubmitting(false);
        return;
      }

      toast.success("Password reset! You're now signed in.");
      router.push("/");
      router.refresh();
    } catch {
      setFormError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <Label htmlFor="password" className="mb-1.5 block text-[13px] font-medium">
          New password
        </Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          autoFocus
          required
          minLength={PASSWORD_MIN}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={`At least ${PASSWORD_MIN} characters`}
          hint={`${PASSWORD_MIN}+ characters with letters, numbers and symbols.`}
          className={FIELD_CLASS}
        />
      </div>

      <div>
        <Label htmlFor="confirm-password" className="mb-1.5 block text-[13px] font-medium">
          Confirm new password
        </Label>
        <PasswordInput
          id="confirm-password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Type your new password again"
          className={FIELD_CLASS}
        />
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
            Updating password…
          </>
        ) : (
          "Set new password"
        )}
      </Button>
    </form>
  );
}
