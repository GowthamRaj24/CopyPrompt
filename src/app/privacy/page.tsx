import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How mycopyprompt collects, uses, and stores your data — including cookies used for Google AdSense advertising.",
};

const LAST_UPDATED = "June 13, 2026";

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
              mycopyprompt is free to use. We may show ads through Google
              AdSense to help cover hosting costs. We don&apos;t sell your
              personal data. We collect only what we need to run the service
              and measure aggregate usage.
            </p>
          </Section>

          <Section title="What we collect">
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong className="font-semibold text-foreground">
                  Anonymous browsing:
                </strong>{" "}
                page views and copy counts, in aggregate. We do not build
                cross-site profiles of anonymous visitors.
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

          <Section title="Cookies and advertising">
            <p>
              Google AdSense may set cookies or use similar technologies to
              serve and measure ads, including personalized ads where
              permitted by law. Third-party vendors, including Google, use
              cookies to serve ads based on your prior visits to this site
              or other sites.
            </p>
            <p className="mt-3">
              You can opt out of personalized advertising by visiting{" "}
              <a
                href="https://www.google.com/settings/ads"
                className="link-underline text-primary"
                rel="noopener noreferrer"
                target="_blank"
              >
                Google Ads Settings
              </a>{" "}
              or{" "}
              <a
                href="https://www.aboutads.info/choices/"
                className="link-underline text-primary"
                rel="noopener noreferrer"
                target="_blank"
              >
                aboutads.info
              </a>
              .
            </p>
            <p className="mt-3">
              Learn how Google uses data from partner sites:{" "}
              <a
                href="https://policies.google.com/technologies/partner-sites"
                className="link-underline text-primary"
                rel="noopener noreferrer"
                target="_blank"
              >
                Google partner sites policy
              </a>
              .
            </p>
          </Section>

          <Section title="What we don't do">
            <ul className="ml-5 list-disc space-y-2">
              <li>We don&apos;t sell your personal data to anyone.</li>
              <li>We don&apos;t share your email with marketing partners.</li>
              <li>We don&apos;t send marketing emails you didn&apos;t ask for.</li>
            </ul>
          </Section>

          <Section title="Third-party services">
            <p>
              Authentication is handled by Supabase. Verification and reset
              emails are sent via SMTP. The site is hosted on Vercel.
              Advertising is served by Google AdSense (Google Ireland Limited
              / Google LLC). Analytics may include Vercel Analytics and
              Speed Insights.
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
                href="mailto:hello@mycopyprompt.in"
                className="link-underline text-primary"
              >
                hello@mycopyprompt.in
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
