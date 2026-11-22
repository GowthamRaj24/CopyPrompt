import type { Metadata } from "next";
import Link from "next/link";
import { SITE_BRAND } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms governing your use of mycopyprompt — short, fair, and written in plain English.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "November 19, 2026";

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
          <Section title="Agreement to terms">
            <p>
              By accessing or using {SITE_BRAND.displayName} (&ldquo;the
              Service&rdquo;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, do not use the Service.
              {SITE_BRAND.displayName} is operated at{" "}
              <span className="font-medium text-foreground">
                {SITE_BRAND.domain}
              </span>
              .
            </p>
          </Section>

          <Section title="Use of the service">
            <p>
              {SITE_BRAND.displayName} is free to use. You can search, copy,
              and paste any prompt without an account. With an account, you can
              save favorites, create collections, submit prompts, and use the
              AI prompt generator.
            </p>
            <p className="mt-3">You agree not to:</p>
            <ul className="ml-5 mt-2 list-disc space-y-1.5">
              <li>
                Use the Service for any unlawful purpose or in violation of
                any applicable laws.
              </li>
              <li>
                Attempt to scrape, crawl, or bulk-download the prompt catalog
                for the purpose of building a competing service.
              </li>
              <li>
                Interfere with the operation of the Service, including through
                automated tools that exceed reasonable usage patterns.
              </li>
              <li>
                Impersonate other users or misrepresent your identity.
              </li>
              <li>
                Circumvent any rate limits, access controls, or security
                measures.
              </li>
            </ul>
          </Section>

          <Section title="Eligibility">
            <p>
              You must be at least 13 years of age to use{" "}
              {SITE_BRAND.displayName}. If you are under 18, you represent that
              you have your parent or guardian&apos;s consent to use the
              Service.
            </p>
          </Section>

          <Section title="Content you submit">
            <p>
              By submitting a prompt, you grant {SITE_BRAND.displayName} a
              non-exclusive, worldwide, royalty-free license to display,
              distribute, and share it on the platform. You retain the
              copyright to your content. You can request removal at any time.
            </p>
            <p className="mt-3">You agree not to submit:</p>
            <ul className="ml-5 mt-2 list-disc space-y-1.5">
              <li>Content you don&apos;t have the right to share.</li>
              <li>Illegal, hateful, or harassing content.</li>
              <li>Prompts designed to bypass AI safety filters.</li>
              <li>Spam, duplicates, or low-effort submissions.</li>
              <li>
                Content that infringes on the intellectual property rights of
                any third party.
              </li>
            </ul>
          </Section>

          <Section title="Content we display">
            <p>
              Prompts on {SITE_BRAND.displayName} come from the community. We
              review every submission, but we&apos;re not perfect. If you find
              a prompt that violates our rules, email us and we&apos;ll remove
              it.
            </p>
          </Section>

          <Section title="Intellectual property">
            <p>
              The {SITE_BRAND.displayName} name, logo, website design, user
              interface, and software are the property of{" "}
              {SITE_BRAND.displayName} and are protected by applicable
              intellectual property laws. You may not copy, modify, or
              distribute any part of the Service (other than individual
              prompts, which are shared under the license granted by their
              authors) without prior written consent.
            </p>
          </Section>

          <Section title="Advertising">
            <p>
              {SITE_BRAND.displayName} may display third-party advertisements
              (including Google AdSense) to help cover operating costs. Ads may
              use cookies as described in our{" "}
              <Link href="/privacy" className="link-underline text-primary">
                Privacy policy
              </Link>
              . We do not endorse products or services shown in ads.
            </p>
          </Section>

          <Section title="AI prompt generator">
            <p>
              The AI prompt generator feature uses Google Gemini to produce
              prompt suggestions. Generated content is provided as-is, and{" "}
              {SITE_BRAND.displayName} makes no guarantees about the accuracy,
              quality, or fitness of generated prompts for any particular
              purpose. You are responsible for reviewing and validating any
              generated content before use.
            </p>
          </Section>

          <Section title="No warranties">
            <p>
              {SITE_BRAND.displayName} is provided &ldquo;as is&rdquo; and
              &ldquo;as available&rdquo; without warranties of any kind, either
              express or implied, including but not limited to implied
              warranties of merchantability, fitness for a particular purpose,
              and non-infringement. We don&apos;t guarantee specific results
              from any prompt. Outputs from AI tools may be inaccurate,
              offensive, or copyrighted by third parties — that&apos;s on you
              to verify.
            </p>
          </Section>

          <Section title="Limitation of liability">
            <p>
              To the fullest extent permitted by law,{" "}
              {SITE_BRAND.displayName}, its operators, and affiliates shall not
              be liable for any indirect, incidental, special, consequential,
              or punitive damages, or any loss of profits, data, use, or
              goodwill, arising out of or in connection with your use of the
              Service, whether based on warranty, contract, tort, or any other
              legal theory. Our total liability for any claim arising from the
              Service shall not exceed the amount you paid to us (which is
              zero for free-tier users).
            </p>
          </Section>

          <Section title="Indemnification">
            <p>
              You agree to indemnify and hold harmless{" "}
              {SITE_BRAND.displayName}, its operators, and affiliates from any
              claims, damages, liabilities, and expenses (including reasonable
              legal fees) arising from your use of the Service, your content
              submissions, or your violation of these terms.
            </p>
          </Section>

          <Section title="Copyright and DMCA">
            <p>
              If you believe content on {SITE_BRAND.displayName} infringes
              your copyright, please contact us at{" "}
              <a
                href={`mailto:${SITE_BRAND.contactEmail}`}
                className="link-underline text-primary"
              >
                {SITE_BRAND.contactEmail}
              </a>{" "}
              with the following information:
            </p>
            <ul className="ml-5 mt-2 list-disc space-y-1.5">
              <li>
                A description of the copyrighted work you claim has been
                infringed.
              </li>
              <li>
                The URL of the content on our site that you claim is
                infringing.
              </li>
              <li>
                Your contact information (name, email, and mailing address).
              </li>
              <li>
                A statement that you have a good-faith belief that the use is
                not authorized by the copyright owner.
              </li>
              <li>
                A statement, under penalty of perjury, that the information in
                your notice is accurate and that you are the copyright owner
                or authorized to act on the owner&apos;s behalf.
              </li>
            </ul>
            <p className="mt-3">
              We will investigate and respond to valid copyright complaints
              promptly.
            </p>
          </Section>

          <Section title="Account termination">
            <p>
              You can delete your account at any time from your account
              settings. We may suspend or terminate accounts that violate these
              terms, with or without notice. Upon termination, your right to
              use the Service ceases immediately, but provisions that by their
              nature should survive (such as indemnification and limitation of
              liability) will remain in effect.
            </p>
          </Section>

          <Section title="Governing law">
            <p>
              These terms shall be governed by and construed in accordance with
              the laws of India. Any disputes arising from these terms or the
              use of {SITE_BRAND.displayName} shall be subject to the exclusive
              jurisdiction of the courts in India.
            </p>
          </Section>

          <Section title="Dispute resolution">
            <p>
              Before initiating any legal proceedings, you agree to contact us
              at{" "}
              <a
                href={`mailto:${SITE_BRAND.contactEmail}`}
                className="link-underline text-primary"
              >
                {SITE_BRAND.contactEmail}
              </a>{" "}
              and attempt to resolve the dispute informally. We will make
              reasonable efforts to resolve the matter within 30 days.
            </p>
          </Section>

          <Section title="Changes to these terms">
            <p>
              We may update these terms occasionally. We&apos;ll bump the
              &ldquo;Last updated&rdquo; date at the top — material changes
              will be announced in-app. Continued use of{" "}
              {SITE_BRAND.displayName} after changes constitutes acceptance of
              the revised terms.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions? Email{" "}
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
