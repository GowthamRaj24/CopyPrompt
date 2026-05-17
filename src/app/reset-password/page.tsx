import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ResetPasswordForm } from "./components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your mycopyprompt account.",
};

interface PageProps {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const tokenHash = sp.token_hash ?? "";

  // Show error state if there's no valid token
  if (!tokenHash) {
    return (
      <AuthLayout
        title="Invalid reset link"
        subtitle="This link is missing or expired. Request a new one to reset your password."
        footer={
          <Link href="/forgot-password" className="link-underline text-primary">
            Request a new reset link
          </Link>
        }
      >
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[13px] text-destructive">
          The password reset link is missing or invalid. Please request a new
          one.
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a new password for your account. You'll be signed in automatically."
      footer={
        <Link href="/signin" className="link-underline text-primary">
          Back to sign in
        </Link>
      }
    >
      <ResetPasswordForm tokenHash={tokenHash} />
    </AuthLayout>
  );
}
