import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ForgotPasswordForm } from "./components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your mycopyprompt password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to set a new password."
      footer={
        <>
          Remember your password?{" "}
          <Link
            href="/signin"
            className="link-underline text-primary"
          >
            Sign in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
