import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The terms governing your use of CopyPrompt — short, fair, and written in plain English.",
};

const LAST_UPDATED = "May 11, 2026";

export default function TermsPage() {
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
            Terms of service
          </h1>
          <p className="mt-3 text-[13px] text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
        </header>

        <div className="space-y-6 text-[15px] leading-[1.75] text-foreground/90">
          <Section title="Use of the service">
            <p>
              CopyPrompt is free to use. You can search, copy, and paste
              any prompt without an account. With an account, you can save
              favorites and submit prompts.
            </p>
          </Section>

          <Section title="Content you submit">
            <p>
              By submitting a prompt, you grant CopyPrompt a non-exclusive,
              royalty-free license to display, distribute, and share it on
              the platform. You keep the copyright. You can request
              removal at any time.
            </p>
            <p className="mt-3">You agree not to submit:</p>
            <ul className="ml-5 mt-2 list-disc space-y-1.5">
              <li>Content you don&apos;t have the right to share.</li>
              <li>Illegal, hateful, or harassing content.</li>
              <li>Prompts designed to bypass AI safety filters.</li>
              <li>Spam, duplicates, or low-effort submissions.</li>
            </ul>
          </Section>

          <Section title="Content we display">
            <p>
              Prompts on CopyPrompt come from the community. We review
              every submission, but we&apos;re not perfect. If you find a
              prompt that violates our rules, email us and we&apos;ll
              remove it.
            </p>
          </Section>

          <Section title="No warranties">
            <p>
              CopyPrompt is provided &ldquo;as is.&rdquo; We don&apos;t
              guarantee specific results from any prompt. Outputs from AI
              tools may be inaccurate, offensive, or copyrighted by third
              parties — that&apos;s on you to verify.
            </p>
          </Section>

          <Section title="Account termination">
            <p>
              You can delete your account at any time. We may suspend
              accounts that violate these terms.
            </p>
          </Section>

          <Section title="Changes to these terms">
            <p>
              We may update these terms occasionally. We&apos;ll bump the
              &ldquo;Last updated&rdquo; date at the top — material
              changes will be announced in-app.
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
          <Link
            href="/privacy"
            className="link-underline hover:text-foreground"
          >
            Privacy policy
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
