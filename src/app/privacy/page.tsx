import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How CopyPrompt collects, uses, and stores your data. Short version: we collect almost nothing.",
};

const LAST_UPDATED = "May 11, 2026";

export default function PrivacyPage() {
  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
        <header className="reveal mb-10 border-b border-border pb-6 md:mb-14">
          <p className="eyebrow mb-2">Legal</p>
          <h1 className="text-3xl font-bold tracking-[-0.02em] md:text-5xl">
            Privacy policy
          </h1>
          <p className="mt-3 text-[13px] text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
        </header>

        <div className="prose space-y-6 text-[15px] leading-[1.75] text-foreground/90">
          <Section title="The short version">
            <p>
              CopyPrompt is free and ad-free. We don&apos;t sell your data.
              We don&apos;t track you across the web. We collect the bare
              minimum needed to run the service.
            </p>
          </Section>

          <Section title="What we collect">
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong className="font-semibold text-foreground">
                  Anonymous browsing:
                </strong>{" "}
                page views and copy counts, in aggregate. No cookies, no
                fingerprints.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Sign-up data:
                </strong>{" "}
                if you create an account, your email and (optionally) your
                name. Stored in Supabase.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Favorites:
                </strong>{" "}
                the prompts you save are tied to your account.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Submissions:
                </strong>{" "}
                the prompts you submit are tied to your account.
              </li>
            </ul>
          </Section>

          <Section title="What we don't do">
            <ul className="ml-5 list-disc space-y-2">
              <li>We don&apos;t use ad-tracking cookies.</li>
              <li>We don&apos;t sell your data to anyone.</li>
              <li>We don&apos;t share your email with partners.</li>
              <li>We don&apos;t send marketing emails you didn&apos;t ask for.</li>
            </ul>
          </Section>

          <Section title="Third-party services">
            <p>
              Authentication is handled by Supabase. Verification + reset
              emails are sent via SMTP through Gmail. The site is hosted
              on Vercel.
            </p>
          </Section>

          <Section title="Your rights">
            <p>
              You can sign out, delete your account, or request a copy of
              your data at any time. Contact us via the email below.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions? Email{" "}
              <a
                href="mailto:hello@copyprompt.dev"
                className="link-underline text-primary"
              >
                hello@copyprompt.dev
              </a>
              .
            </p>
          </Section>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-8 text-[13px] text-muted-foreground">
          <Link href="/terms" className="link-underline hover:text-foreground">
            Terms of service
          </Link>
          <span className="text-muted-foreground/40" aria-hidden>
            ·
          </span>
          <Link href="/about" className="link-underline hover:text-foreground">
            About
          </Link>
        </div>
      </div>
    </section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold tracking-[-0.01em] text-foreground md:text-xl">
        {title}
      </h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}
