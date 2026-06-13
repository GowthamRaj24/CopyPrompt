import { MailIcon, MapPinIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_BRAND } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${SITE_BRAND.displayName} — questions about prompts, submissions, privacy, or partnerships.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
        <header className="reveal mb-10 border-b border-border pb-6 md:mb-14">
          <p className="eyebrow mb-2">Contact</p>
          <h1 className="text-3xl font-bold tracking-[-0.02em] md:text-5xl">
            Get in touch
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Questions about submissions, account data, advertising, or site
            quality? We read every message and usually reply within two business
            days.
          </p>
        </header>

        <div className="space-y-8 text-[15px] leading-[1.75] text-foreground/90">
          <div className="rounded-xl border border-border/50 bg-card/40 p-5 md:p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold tracking-[-0.01em]">
              <MailIcon className="size-4 text-primary" aria-hidden />
              Email
            </h2>
            <p className="mt-3 text-muted-foreground">
              For general support, privacy requests, and partnership inquiries:
            </p>
            <a
              href={`mailto:${SITE_BRAND.contactEmail}`}
              className="link-underline mt-2 inline-block font-medium text-primary"
            >
              {SITE_BRAND.contactEmail}
            </a>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/40 p-5 md:p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold tracking-[-0.01em]">
              <MapPinIcon className="size-4 text-primary" aria-hidden />
              Operator
            </h2>
            <p className="mt-3 text-muted-foreground">
              {SITE_BRAND.displayName} is operated at{" "}
              <span className="font-medium text-foreground">
                {SITE_BRAND.domain}
              </span>
              . See our{" "}
              <Link href="/about" className="link-underline text-foreground">
                About
              </Link>{" "}
              page for platform details and{" "}
              <Link href="/privacy" className="link-underline text-foreground">
                Privacy
              </Link>{" "}
              for how we handle data.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold tracking-[-0.01em]">
              Before you write
            </h2>
            <ul className="ml-5 mt-3 list-disc space-y-2 text-muted-foreground">
              <li>
                Submission status — check your email for the review notification
                or sign in to view account activity.
              </li>
              <li>
                Prompt quality — read our{" "}
                <Link href="/guides" className="link-underline text-foreground">
                  guides
                </Link>{" "}
                and include proof (sample output or images) when submitting.
              </li>
              <li>
                Privacy or deletion — include the email tied to your account so
                we can verify ownership.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
