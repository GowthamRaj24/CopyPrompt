import type { Metadata } from "next";
import Link from "next/link";
import { SITE_BRAND } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How mycopyprompt collects, uses, and stores your data — including cookies used for Google AdSense advertising.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "November 19, 2026";

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
              {SITE_BRAND.displayName} is free to use. We may show ads through
              Google AdSense to help cover hosting costs. We don&apos;t sell
              your personal data. We collect only what we need to run the
              service and measure aggregate usage. This policy explains what we
              collect, why, and how you can control it.
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
                  Favorites and collections:
                </strong>{" "}
                the prompts you save and the collections you create are tied to
                your account.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Submissions:
                </strong>{" "}
                the prompts you submit are tied to your account.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Copy history:
                </strong>{" "}
                prompts you copy are logged for your personal &ldquo;recently
                copied&rdquo; feed. This data is retained for 30 days and then
                automatically deleted.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  AI prompt generator usage:
                </strong>{" "}
                when you use the /generate feature, your description is sent to
                the Google Gemini API to produce a prompt. We do not store your
                description permanently. Request IPs are salted and hashed — we
                never store raw IP addresses.
              </li>
            </ul>
          </Section>

          <Section title="Data retention">
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong className="font-semibold text-foreground">
                  Account data:
                </strong>{" "}
                retained for as long as your account exists. You can delete
                your account at any time from Account → Privacy &amp; data.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Copy history:
                </strong>{" "}
                automatically pruned after 30 days via a nightly cron job.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Generated prompts:
                </strong>{" "}
                stored in your account history for 30 days.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Server logs:
                </strong>{" "}
                retained for up to 30 days for debugging and abuse prevention,
                then deleted.
              </li>
            </ul>
          </Section>

          <Section title="Cookies and advertising">
            <p>
              We use the following types of cookies and similar technologies:
            </p>
            <ul className="ml-5 mt-3 list-disc space-y-2">
              <li>
                <strong className="font-semibold text-foreground">
                  Essential cookies:
                </strong>{" "}
                authentication session cookies (set by Supabase Auth) and theme
                preference. These are necessary for the site to function and
                cannot be disabled.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Advertising cookies:
                </strong>{" "}
                Google AdSense may set cookies or use similar technologies to
                serve and measure ads, including personalized ads where
                permitted by law. Third-party vendors, including Google, use
                cookies to serve ads based on your prior visits to this site
                or other sites.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Analytics cookies:
                </strong>{" "}
                Vercel Analytics and Speed Insights may collect anonymous
                performance metrics (page load times, Web Vitals) to help us
                improve site performance. These do not track individual users
                across sites.
              </li>
            </ul>
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

          <Section title="Legal basis for processing">
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong className="font-semibold text-foreground">
                  Contract:
                </strong>{" "}
                when you create an account, we process data necessary to
                provide the service you signed up for.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Consent:
                </strong>{" "}
                for personalized advertising and optional analytics, where
                required by law.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Legitimate interest:
                </strong>{" "}
                aggregate usage statistics, abuse prevention, and service
                improvement.
              </li>
            </ul>
          </Section>

          <Section title="What we don't do">
            <ul className="ml-5 list-disc space-y-2">
              <li>We don&apos;t sell your personal data to anyone.</li>
              <li>We don&apos;t share your email with marketing partners.</li>
              <li>
                We don&apos;t send marketing emails you didn&apos;t ask for.
              </li>
              <li>
                We don&apos;t build cross-site advertising profiles of our
                users.
              </li>
              <li>
                We don&apos;t store raw IP addresses — IPs used for abuse
                prevention are salted and hashed.
              </li>
            </ul>
          </Section>

          <Section title="Third-party services">
            <p>We use the following third-party services:</p>
            <ul className="ml-5 mt-3 list-disc space-y-2">
              <li>
                <strong className="font-semibold text-foreground">
                  Supabase:
                </strong>{" "}
                authentication, database hosting, and file storage.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Vercel:
                </strong>{" "}
                web hosting, edge functions, analytics, and speed insights.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Google AdSense:
                </strong>{" "}
                advertising (Google Ireland Limited / Google LLC).
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Google Gemini API:
                </strong>{" "}
                AI prompt generation via the /generate feature.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  SMTP (email):
                </strong>{" "}
                transactional emails (welcome, submission review, saved search
                digests).
              </li>
            </ul>
            <p className="mt-3">
              Each service has its own privacy policy. We encourage you to
              review their policies for details on how they handle data.
            </p>
          </Section>

          <Section title="International data transfers">
            <p>
              Your data may be processed and stored in the United States or
              other countries where our service providers operate.
              {SITE_BRAND.displayName} relies on its service providers&apos;
              compliance frameworks (including standard contractual clauses
              where applicable) to ensure adequate data protection.
            </p>
          </Section>

          <Section title="Children's privacy">
            <p>
              {SITE_BRAND.displayName} is not directed at children under 13
              years of age. We do not knowingly collect personal information
              from children under 13. If you believe a child under 13 has
              provided us with personal data, please contact us and we will
              promptly delete that information.
            </p>
          </Section>

          <Section title="Your rights">
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="ml-5 mt-3 list-disc space-y-2">
              <li>
                Access, correct, or delete your personal data.
              </li>
              <li>
                Export your data in a portable format (available from Account →
                Privacy &amp; data).
              </li>
              <li>
                Object to or restrict certain types of processing.
              </li>
              <li>
                Withdraw consent for personalized advertising at any time.
              </li>
              <li>
                Lodge a complaint with your local data protection authority.
              </li>
            </ul>
            <p className="mt-3">
              You can delete your account and all associated data at any time
              from your account settings. Contact us at the email below for any
              privacy-related requests.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this policy occasionally. We&apos;ll update the
              &ldquo;Last updated&rdquo; date at the top. Material changes will
              be announced in-app. Continued use of {SITE_BRAND.displayName}{" "}
              after changes constitutes acceptance of the revised policy.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about privacy? Email{" "}
              <a
                href={`mailto:${SITE_BRAND.contactEmail}`}
                className="link-underline text-primary"
              >
                {SITE_BRAND.contactEmail}
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
