import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { getCurrentUser } from "@/server/lib/auth";
import { SignUpForm } from "./components/SignUpForm";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Create a free CopyPrompt account to save favorites and submit prompts.",
};

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function SignUpPage({ searchParams }: PageProps) {
  const { next } = await searchParams;

  // Redirect away if already signed in
  const user = await getCurrentUser();
  if (user) {
    redirect(next ?? "/account");
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free forever. No credit card. Save prompts and submit your own."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={next ? `/signin?next=${encodeURIComponent(next)}` : "/signin"}
            className="link-underline text-primary"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm next={next} />
    </AuthLayout>
  );
}
