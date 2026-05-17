import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { getCurrentUser } from "@/server/lib/auth";
import { SignInForm } from "./components/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to CopyPrompt to save favorites, submit prompts, and unlock premium features.",
};

interface PageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function SignInPage({ searchParams }: PageProps) {
  const { next, error } = await searchParams;

  // Redirect away if already signed in
  const user = await getCurrentUser();
  if (user) {
    redirect(next ?? "/account");
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <>
          New here?{" "}
          <Link
            href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
            className="link-underline text-primary"
          >
            Create an account
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-[13px] text-destructive">
          {decodeURIComponent(error)}
        </div>
      )}
      <SignInForm next={next} />
    </AuthLayout>
  );
}
